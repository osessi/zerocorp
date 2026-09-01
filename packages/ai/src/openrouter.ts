import type { AITextProvider, StructuredRequest, StructuredResponse } from "@zerocorp/application";

/**
 * OpenRouter — D19.
 *
 * One key, any model, chosen in configuration. Two details decide whether the
 * "reject, never repair" rule of ADR 0002 survives a model change, and both are handled
 * here rather than left to whoever edits the .env:
 *
 *   1. Structured-output support is per ENDPOINT, not per model. The same model served
 *      by two providers may support json_schema at one and not the other. Every request
 *      sends provider.require_parameters, so OpenRouter routes only to an endpoint that
 *      actually supports what we asked for, instead of silently downgrading to prose.
 *
 *   2. The configured model is verified at boot. A model that does not advertise
 *      structured_outputs makes the app refuse to start, loudly, rather than fail on the
 *      first real visitor.
 *
 * Cost comes from the response, not from a table. A hard-coded price list is wrong the
 * day the model changes, and a margin figure that is quietly wrong is worse than none.
 */

const BASE_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs?: number;
  /** Sent as HTTP-Referer and X-Title; OpenRouter uses them for attribution. */
  readonly appUrl?: string;
  readonly appName?: string;
  readonly fetchImpl?: typeof fetch;
}

export class OpenRouterError extends Error {
  override readonly name = "OpenRouterError";
  constructor(readonly status: number | null, detail: string) {
    super(`OpenRouter request failed${status === null ? "" : ` (${status})`}: ${detail}`);
  }
}

export class UnsupportedModelError extends Error {
  override readonly name = "UnsupportedModelError";
  constructor(model: string, detail: string) {
    super(
      `Model "${model}" cannot be used: ${detail}\n` +
        `  ZeroCorp requires structured outputs. Without them an LLM's answer is prose,\n` +
        `  and every schema guarantee in ADR 0002 becomes a hope.\n` +
        `  Pick a model listed by: ${BASE_URL}/models?supported_parameters=structured_outputs`,
    );
  }
}

interface ModelsResponse {
  data: Array<{ id: string; supported_parameters?: string[] }>;
}

/**
 * Boot check. Throws rather than warning.
 *
 * A warning in a log is a warning nobody reads until a customer reports a broken
 * assessment.
 */
export async function assertModelSupportsStructuredOutput(
  options: Pick<OpenRouterOptions, "apiKey" | "model" | "fetchImpl">,
): Promise<void> {
  const doFetch = options.fetchImpl ?? fetch;
  const response = await doFetch(`${BASE_URL}/models`, {
    headers: { authorization: `Bearer ${options.apiKey}` },
  });
  if (!response.ok) {
    throw new UnsupportedModelError(options.model, `could not read the model list (${response.status})`);
  }

  const payload = (await response.json()) as ModelsResponse;
  const model = payload.data.find((m) => m.id === options.model);
  if (!model) throw new UnsupportedModelError(options.model, "no model with that id exists on OpenRouter");

  const supported = model.supported_parameters ?? [];
  if (!supported.includes("structured_outputs")) {
    throw new UnsupportedModelError(options.model, "it does not advertise structured_outputs");
  }
}

interface CompletionResponse {
  model: string;
  choices: Array<{ message: { content: string | null } }>;
  usage?: { prompt_tokens: number; completion_tokens: number; cost?: number };
}

export class OpenRouterTextProvider implements AITextProvider {
  readonly provider = "openrouter";

  constructor(private readonly options: OpenRouterOptions) {}

  async generateStructured(request: StructuredRequest): Promise<StructuredResponse> {
    const doFetch = this.options.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 60_000);

    let response: Response;
    try {
      response = await doFetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.options.apiKey}`,
          ...(this.options.appUrl ? { "http-referer": this.options.appUrl } : {}),
          ...(this.options.appName ? { "x-title": this.options.appName } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.options.model,
          max_tokens: request.maxOutputTokens,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: request.schemaName, strict: true, schema: request.jsonSchema },
          },
          // Route ONLY to an endpoint that supports what we asked for. Without this,
          // OpenRouter may pick a provider that ignores response_format and returns
          // prose, which parses as invalid and burns a retry for no reason.
          provider: { require_parameters: true },
          // Ask for the real cost of this generation rather than inferring it.
          usage: { include: true },
        }),
      });
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === "AbortError";
      throw new OpenRouterError(null, aborted ? "timed out" : String(cause));
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // Truncated, and never logged here: the caller decides what reaches a log.
      const body = await response.text().catch(() => "");
      throw new OpenRouterError(response.status, body.slice(0, 300));
    }

    const payload = (await response.json()) as CompletionResponse;
    const content = payload.choices[0]?.message.content;
    if (content === null || content === undefined) {
      throw new OpenRouterError(null, "the model returned no content");
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      // Not repaired. An endpoint that returned prose despite require_parameters is a
      // routing problem, and pretending otherwise hides it.
      throw new OpenRouterError(null, "the response was not JSON despite a json_schema request");
    }

    return {
      json,
      provider: this.provider,
      model: payload.model,
      inputTokens: payload.usage?.prompt_tokens ?? 0,
      outputTokens: payload.usage?.completion_tokens ?? 0,
      // OpenRouter reports cost in dollars. Micro-dollars is our unit — migration 0006.
      ...(payload.usage?.cost !== undefined
        ? { costMicros: Math.round(payload.usage.cost * 1_000_000) }
        : {}),
    };
  }
}
