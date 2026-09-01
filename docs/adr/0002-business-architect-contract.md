# ADR 0002 — The Business Architect contract

| | |
|---|---|
| **Status** | **Accepted** |
| **Date** | 2026-09-01 |
| **Deciders** | Olivier Kakpo (product owner) |
| **Applies to** | `packages/ai`, the Free Business Assessment, every later generative feature |
| **Enforces** | `CLAUDE_CODE_RULES.md` §15 and §16, `ARCHITECTURE.md` §12 |

---

## Context

The Business Architect is the centre of V1. It reads what a visitor said about their
business and produces the analysis and the plan the whole funnel is built on, before
any money has changed hands.

That makes it the single highest-risk component in the product, for three reasons that
have nothing to do with model quality:

1. **It runs for free, for strangers.** Every visitor costs money and most will not
   convert. `PRODUCT_SPEC.md` §29.3 block 0 is explicit: no expensive free onboarding.
2. **Its output drives a purchase.** A plan is what the customer approves and pays
   against. Free text that the business layer interprets is a plan nobody can hold to.
3. **It sits next to sensitive data.** The assessment lives alongside identity
   documents and payment records. A prompt that can reach them is a prompt that can
   leak them.

---

## Decision

### 1. The input is a closed type. Anything not in it cannot be seen.

```ts
ArchitectInput = {
  answers          the 3 to 5 assessment answers, already schema-validated
  transcripts      optional, per question, from audio the visitor recorded
  catalog          the entity types available, with their honest automation level
  constraints      what the customer has ruled in or out
  conversation     prior turns, for a regeneration
  locale
}
```

The architect is **not given a repository, a tenant context, a database handle or a
tool**. It is a pure function from that object to a validated result, which means the
question "could the model see a passport number" is answered by the type, not by a
review of the prompt.

### 2. Data it may never receive

```text
identity documents, or any field extracted from one
passport, national id, tax id, date of birth
payment details, Stripe ids, card data
email address, phone number, postal address
other tenants' data, of any kind
raw database rows
```

Contact details are excluded deliberately even though we hold them: the analysis does
not improve when the model knows the visitor's name, and every field added to a prompt
is a field that can appear in a model provider's logs.

A test asserts that no key matching those names exists anywhere in the serialised input.

### 3. The output is structured, validated, and rejected on failure

```text
prompt → model → JSON → Zod → business validation → persistence
                          ↓ invalid
                    rejected, recorded, retried once, then failed
```

`architectOutputSchema` is the contract. An output that does not parse is **not
repaired, not partially used, and never shown**. `assessments.status` goes to `failed`,
which is a reparable state, and the visitor is offered a retry.

Three business validations run after the schema, because a well-formed plan can still
be wrong:

| Check | Why |
|---|---|
| Every `recommendedEntityTypeCode` exists in the catalog | A model may name a plausible entity we do not offer |
| `form_new` ⇒ entity and jurisdiction both present; anything else ⇒ both absent | Already a schema refinement. Restated because it is the anti-upsell rule |
| Every excluded jurisdiction in `constraints` is absent from the recommendation | "I don't want a Delaware company" has to survive a regeneration |

### 4. What it must always produce

```text
analysis.headline            one line the visitor recognises as their business
analysis.whereYouAre
analysis.whereYouWantToGo
analysis.whatIsMissing       2 to 6 gaps, each with a severity
plan.companyRecommendation   form_new | use_existing | none_needed
plan.recommendationReason
plan.steps                   4 to 14, each with an outcome and a rationale
```

**`none_needed` is a required capability, not an edge case.** An architect that can only
form or import a company will always do one of the two, and "you do not need a company
for this yet" is often the honest answer. `CLAUDE_CODE_RULES.md` §44 forbids
recommending a new entity as a default.

### 5. What it must never produce

```text
a price                  no field in the schema can hold one; a test asserts it
a legal opinion          the system prompt forbids advice; the UI labels output as
                         guidance, never as counsel from a lawyer
a provider name          D14 — the customer-facing model has no provider in it
an automation claim      automation_level comes from the catalog, never from the model
HTML, React, CSS         §16 — the model composes an approved language, never invents one
```

### 6. Model routing

| Task | Model | Why |
|---|---|---|
| Free assessment | **Haiku 4.5** | It runs for strangers who mostly will not convert |
| Plan revision after a customer message | **Sonnet** | Fewer runs, higher stakes, the customer is arguing with it |
| Deep onboarding (later) | **Sonnet** | Behind the paywall, where the real cost belongs |

Routing is configuration, not code. The task name is the key.

---

## External services

Verified 2026-09-01. **List prices, not contracted rates.**

### Text — Anthropic

| Model | Input / 1M | Output / 1M |
|---|---|---|
| Haiku 4.5 | $1.00 | $5.00 |
| Sonnet | $3.00 | $15.00 |
| Opus 4.8 | $5.00 | $25.00 |

Batch halves both. Prompt caching cuts cached input by ~90%, and the catalog plus system
prompt are identical across every assessment, which is exactly the shape caching pays for.

**Cost of one free assessment**, at roughly 3,000 input and 2,500 output tokens:

```text
Haiku 4.5    ~$0.016     10,000 free assessments ≈ $160
Sonnet       ~$0.047     10,000 free assessments ≈ $470
```

The cost is not the binding constraint. **Abuse is.** Ten thousand genuine visitors are
affordable; one script is not. So the limits below are the real control.

### Audio — transcription

| Provider | Batch, per minute |
|---|---|
| AssemblyAI Universal-2 | ~$0.0025 |
| OpenAI gpt-4o-mini-transcribe | ~$0.003 |
| Deepgram Nova-3 | ~$0.0043 |

At a 2-minute cap per answer across 5 answers, audio adds **$0.025 to $0.043** per
assessment — comparable to the model call itself, and it doubles the cost of a visitor
who was never going to convert.

**Decision: audio is optional, capped at 2 minutes per answer in the free tier, and
transcribed with a batch API.** No streaming: nothing in this funnel needs a live
transcript, and streaming costs roughly twice as much.

### Limits

```text
1 analysis per assessment, plus 3 regenerations         beyond that, ask for contact details
2 minutes of audio per answer, 5 answers                free tier
10 assessments per IP per day                           rate limit at the edge
1 concurrent analysis per assessment                    a second request returns the first
```

### Fallbacks

| Failure | Fallback | What the visitor sees |
|---|---|---|
| Model unavailable or times out | Retry once, then `failed` | "We could not finish your assessment. Try again." Their answers are kept |
| Output fails Zod | Retry once with the errors appended, then `failed` | Same. **The invalid output is never partially used** |
| Transcription fails | Keep the audio, mark the answer untranscribed | "We could not hear that clearly. Type it instead?" The funnel never blocks on audio |
| No API key configured | `DeterministicArchitect` | A rules-based analysis built from the answers and the catalog. **Labelled in the UI, and it never claims to be an AI analysis** |

`DeterministicArchitect` is not a mock. It is a real fallback path with real tests, and
it is what makes the funnel demonstrable and testable without a key or a network.

---

## Consequences

**Positive.** The model cannot reach sensitive data, because it is not given any. An
invalid output cannot reach a customer, because nothing partial is used. A price cannot
be hallucinated, because the schema has nowhere to put one. And the whole funnel runs in
CI with no key and no network.

**Negative, and accepted.** A closed input means improving the analysis with a new signal
requires a contract change and a review, which is slower than adding a field to a prompt.
That friction is the point.

**Negative, and mitigated.** Rejecting an unparseable output rather than repairing it
costs a retry and, occasionally, a failed assessment. `failed` is a reparable state and
the answers survive, so the visitor loses a minute rather than their work.

---

## Rejected alternatives

**Free-text analysis rendered as markdown.** Cheaper, faster, and impossible to build a
plan editor on: the customer cannot exclude a step from a paragraph, and a regeneration
cannot preserve a constraint it never parsed.

**Giving the architect tools to query the database.** It would remove the need to assemble
the input. It would also mean the model reaches tenant data, which `CLAUDE_CODE_RULES.md`
§17 forbids and which no amount of prompt discipline makes safe.

**Repairing malformed output with a second "fix this JSON" call.** It usually works, which
is the problem: it converts a loud failure into a quiet one, and the repaired plan is one
nobody specified.
