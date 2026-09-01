import type { AITextProvider, StructuredRequest, StructuredResponse } from "@zerocorp/application";

/**
 * Anthropic Messages API, over fetch.
 *
 * No SDK: the surface used here is one POST, and a dependency that has to be kept
 * current is a poor trade for sixty lines. If streaming or files are ever needed, the
 * SDK earns its place then.
 *
 * Structured output goes through TOOL USE rather than "please return JSON". The model
 * is given a single tool whose input_schema is derived from the Zod contract, and
 * tool_choice forces it. That is far more reliable than parsing prose, and the schema
 * has exactly one definition — a schema written twice is a schema that disagrees with
 * itself.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export interface AnthropicOptions {
  readonly apiKey: string;
  readonly model: string;
  readonly timeoutMs?: number;
  /** Injected so tests do not reach the network. */
  readonly fetchImpl?: typeof fetch;
}

export class AnthropicProviderError extends Error {
  override readonly name = "AnthropicProviderError";
  constructor(readonly status: number | null, detail: string) {
    super(`Anthropic request failed${status === null ? "" : ` (${status})`}: ${detail}`);
  }
}

interface AnthropicResponse {
  content: Array<{ type: string; name?: string; input?: unknown }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export class AnthropicTextProvider implements AITextProvider {
  readonly provider = "anthropic";

  constructor(private readonly options: AnthropicOptions) {}

  async generateStructured(request: StructuredRequest): Promise<StructuredResponse> {
    const doFetch = this.options.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 60_000);

    let response: Response;
    try {
      response = await doFetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.options.apiKey,
          "anthropic-version": API_VERSION,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.options.model,
          max_tokens: request.maxOutputTokens,
          system: request.system,
          messages: [{ role: "user", content: request.user }],
          tools: [
            {
              name: request.schemaName,
              description: "Return the result in exactly this shape.",
              input_schema: request.jsonSchema,
            },
          ],
          // Not "auto". The model must call the tool, so there is no prose path to parse.
          tool_choice: { type: "tool", name: request.schemaName },
        }),
      });
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === "AbortError";
      throw new AnthropicProviderError(null, aborted ? "timed out" : String(cause));
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      // The body may name the account or the key prefix. Truncated, and never logged
      // by this class — the caller decides what reaches a log.
      const body = await response.text().catch(() => "");
      throw new AnthropicProviderError(response.status, body.slice(0, 300));
    }

    const payload = (await response.json()) as AnthropicResponse;
    const toolUse = payload.content.find((c) => c.type === "tool_use" && c.name === request.schemaName);
    if (!toolUse || toolUse.input === undefined) {
      throw new AnthropicProviderError(null, "the model returned no tool call");
    }

    return {
      json: toolUse.input,
      provider: this.provider,
      model: payload.model,
      inputTokens: payload.usage.input_tokens,
      outputTokens: payload.usage.output_tokens,
    };
  }
}
