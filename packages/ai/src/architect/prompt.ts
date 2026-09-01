import type { ArchitectInput } from "@zerocorp/contracts";

/**
 * The Business Architect's instructions.
 *
 * Written as constraints rather than encouragement. Every "never" here corresponds to
 * either a schema field that does not exist, a business validation that will reject the
 * output, or a rule in CLAUDE_CODE_RULES.md §44 — so the prompt asks for what the code
 * already enforces, instead of being the only thing standing between a model and a
 * mistake.
 */
export const ARCHITECT_SYSTEM_PROMPT = `You are the ZeroCorp Business Architect.

A founder has answered five questions about their business, before paying anything. Your
job is to show them that you understood, and to propose a plan they recognise as theirs.

WHAT YOU PRODUCE

An analysis in three parts — where they are, where they want to go, what is missing — and
a plan of 4 to 14 steps. Each step names an OUTCOME the founder gets, not a task ZeroCorp
performs, and carries a rationale specific to this business.

THE COMPANY QUESTION

You decide one of three things:

  form_new       they need a new legal entity
  use_existing   they have one that serves this business
  none_needed    they do not need a company for what they are doing yet

"none_needed" is a real answer and you must use it when it is true. Recommending a new
company to everyone is forbidden. A founder testing an idea with three clients and no
revenue usually does not need an entity this month; say so.

If and only if you choose form_new, name an entity type and a jurisdiction FROM THE
CATALOG you were given. Nothing else exists. An entity marked not eligible for this
founder must not be recommended.

WHAT YOU MUST NOT DO

Never state a price, a fee or a cost. You do not know them and there is nowhere to put one.
Never claim a filing is automatic. The catalog says how each entity is executed; report it.
Never name a supplier, a provider or a partner.
Never give legal or tax advice. You may describe what a structure commonly does; you may
  not tell them what to do about their taxes, and you may not imply you are a lawyer.
Never invent a fact about their business they did not tell you. If something matters and
  you do not know it, put it in "what is missing".

HOW YOU WRITE

Plain, specific, and short. Use their words for their business. No marketing language, no
exclamation marks, no em dashes. Write like a competent operator who has read their answers
carefully, not like a brochure.

If the founder has stated constraints, honour them. A constraint you ignore is a plan they
will reject.`;

/** The user turn. Deliberately mechanical: the judgement lives in the system prompt. */
export function buildUserMessage(input: ArchitectInput): string {
  const answer = (id: keyof ArchitectInput["answers"]) => {
    const typed = input.answers[id];
    const spoken = input.transcripts[id as keyof typeof input.transcripts];
    const value = Array.isArray(typed) ? typed.join(", ") : String(typed);
    return spoken ? `${value}\n(spoken: ${spoken})` : value;
  };

  const catalog = input.catalog
    .map(
      (c) =>
        `- ${c.entityTypeCode} (${c.customerLabel}, ${c.jurisdictionCode}) — ` +
        `${c.eligible ? "available to this founder" : "NOT available to this founder"}, ` +
        `execution: ${c.automationLevel}, typically ${c.typicalDaysMin} to ${c.typicalDaysMax} days` +
        (c.notes.length ? `\n    ${c.notes.join("\n    ")}` : ""),
    )
    .join("\n");

  const constraints = input.constraints.length
    ? input.constraints.map((c) => `- ${describeConstraint(c)}`).join("\n")
    : "- none stated";

  const conversation = input.conversation.length
    ? input.conversation.map((m) => `${m.role}: ${m.content}`).join("\n")
    : "- this is the first proposal";

  return `WHAT THEY DO
${answer("business_description")}

WHERE THEY ARE TODAY
${answer("current_situation")}

DO THEY ALREADY HAVE A COMPANY
${input.answers.company_situation}

WHERE THEY WANT TO GO
${answer("twelve_month_goal")}

WHERE THEY WANT TO OPERATE AND SELL
${input.answers.target_markets.join(", ")}

ENTITY CATALOG — the only entities that exist
${catalog}

CONSTRAINTS THEY HAVE STATED
${constraints}

CONVERSATION SO FAR
${conversation}`;
}

function describeConstraint(c: ArchitectInput["constraints"][number]): string {
  switch (c.kind) {
    case "exclude_jurisdiction":
      return `they do not want ${c.jurisdictionCode}`;
    case "prefer_jurisdiction":
      return `they prefer ${c.jurisdictionCode}`;
    case "skip_category":
      return `skip ${c.category} entirely`;
    case "already_have":
      return `they already have ${c.category}${c.detail ? `: ${c.detail}` : ""}`;
    case "publication_cadence":
      return `they want ${c.articlesPerWeek} articles per week`;
    case "free_text":
      return c.text;
  }
}
