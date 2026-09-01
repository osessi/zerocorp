> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** product scope, plan contents, customer journeys, module behaviour, V1 boundary, product metrics.
>
> **The version roadmap V1 to V5 is §29.** It owns the version boundary and resolves D7.
> Note that §4–§6 are subscription *plans*, not versions — see §29.0.
>
> When this document conflicts with anything under `docs/archive/`, **this document wins**.
> See [`docs/README.md`](./README.md) for the full documentation hierarchy and topic ownership map.
>
> Last reorganized: 2026-08-30

---

# ZeroCorp — Product Specification v1

> Status: Proposed
>
> Purpose: turn the ZeroCorp vision into a product operating model that can be implemented without turning the product into a collection of disconnected features.

---

## 1. Product Definition

ZeroCorp is a platform that helps an entrepreneur launch an American business and progressively delegate its digital operations to ZeroCorp.

Core product promise:

> **Tell us about your business. We'll build the foundation for you.**

Long-term positioning:

> **Start your US business. Then let ZeroCorp run its digital operations.**

The product should feel like a business being assembled and then operated, not like a collection of SaaS tools.

---

## 2. Product Model

Three layers:

```text
BUSINESS LAUNCH
→ establish the company and digital foundation

BUSINESS GROWTH
→ acquire attention, prospects and customers

BUSINESS AUTOPILOT
→ automate recurring digital operations
```

---

## 3. Initial Commercial Model

### One-time setup

Two setup paths, because the answer to *"new business or existing one?"* decides the whole
journey (§29.3 block 1).

| Path | Setup | Status |
|---|---:|---|
| **Business Launch Setup** — new business, formed by ZeroCorp | **$997** | current hypothesis |
| **Business Activation Setup** — existing business, connected or imported | **~$497** | 🟠 placeholder, not yet validated |

An existing company is **connected or imported, never re-formed**. It enters at
`companies.status = active` with no formation order — a formation order records work
ZeroCorp did, and inventing one would put a fiction in the audit trail.

The setup is separate from subscription pricing.

The setup pays for the initial transformation:

- company formation process;
- EIN process;
- business/business-brain setup;
- brand foundation;
- initial website;
- domain onboarding;
- email foundation;
- account configuration;
- launch configuration.

The exact legal/formation package must be validated against the selected provider and customer jurisdiction.

### Recurring plans

Initial pricing hypothesis:

| Plan | Target role | Indicative price |
|---|---|---:|
| Launch | Keep the business infrastructure alive | $99/mo |
| Growth | Acquire and nurture demand | $399/mo |
| Autopilot | Run recurring digital operations | $799/mo |

These are **pricing hypotheses**, not permanent prices. Validate willingness-to-pay, gross margin and conversion before finalizing.

---

## 4. Launch Plan

The $99/month plan should represent the minimum viable ongoing ZeroCorp relationship.

Possible scope:

- website hosting and rendering;
- domain management;
- Business Brain;
- blog;
- content generation;
- basic SEO controls;
- basic analytics;
- maintenance;
- notifications;
- included AI credits;
- basic product support.

Positioning:

> **Your business stays online, current and ready to grow.**

---

## 5. Growth Plan

The Growth plan moves ZeroCorp from presence to acquisition.

Possible scope:

- everything in Launch;
- social publishing;
- prospect database;
- lead enrichment;
- email infrastructure;
- outbound sequences;
- lead follow-up;
- lightweight CRM;
- campaign management;
- advanced analytics;
- higher AI credit allowance;
- automation rules.

Positioning:

> **ZeroCorp helps your business find and follow up with opportunities.**

---

## 6. Autopilot Plan

The Autopilot plan is where autonomous operation becomes central.

Possible scope:

- everything in Growth;
- autonomous agents;
- content strategy;
- social manager;
- lead follow-up agent;
- email assistant;
- business analyst;
- financial assistant;
- advanced intelligence;
- Telegram controls;
- daily autonomous workflows;
- higher usage limits;
- priority automation capacity.

Positioning:

> **Let ZeroCorp run the repetitive digital work.**

---

## 7. Usage and Credits

Subscriptions include a defined allowance.

Usage beyond included allowances may be monetized through credits or metered usage.

Potential billable resources:

- text generation;
- image generation;
- transcription;
- enrichment;
- lead records;
- agent executions;
- advanced automation;
- premium external services.

Never expose raw provider costs as the primary customer experience.

Customer-facing usage should be understandable:

```text
Included credits
Used
Remaining
Estimated reset date
Optional additional usage
```

---

## 8. Product Pillars

### Pillar A — Business Launch

```text
Business
Company
Brand
Website
Domain
Email
Launch
```

### Pillar B — Business Growth

```text
Content
Social
Prospects
Email
CRM
Analytics
```

### Pillar C — Business Autopilot

```text
Agents
Automation
Intelligence
Notifications
Reports
```

---

## 9. Core Onboarding

Primary experience:

# Launch Your Business

Progress:

```text
1. Business
2. Company
3. Brand
4. Website
5. Domain
6. Email
7. Marketing
8. Launch
```

The product should visibly continue working between user actions.

Examples:

> We're already building your website.

> Your website is live.

> Your marketing infrastructure is ready.

> Your company formation has been submitted.

---

## 10. Voice-First Onboarding

Default collection mode:

- 5–6 open voice questions;
- transcription;
- structured extraction;
- Business Brain generation;
- customer review.

Fallback:

- traditional form.

The goal is not “voice for novelty”.

The goal is:

> collect richer business context with less friction.

---

## 11. Business Brain

The Business Brain is the central context layer.

It should contain:

```text
Business identity
Industry
Offer
ICP
Positioning
Unique selling points
Target market
Geographies
Tone of voice
Keywords
Competitors
Brand colors
Logo
Proof
Testimonials
Source documents
Goals
Channels
```

All generation flows should consume approved Business Brain data.

---

## 12. Website Experience

The website builder is structured, not freeform.

Customer controls:

1. edit text/image;
2. reorder/duplicate/delete blocks;
3. request a permitted AI regeneration.

AI does not write arbitrary frontend code.

### Block system

Initial target:

- approximately 12–20 block types;
- begin implementation with a smaller high-quality core;
- approximately 10 approved variants per mature block over time.

Examples:

```text
Hero
Logo Cloud
Features
Services
Stats
Testimonials
Process
Pricing
FAQ
Team
CTA
Contact
Gallery
Comparison
Announcement
Case Study
```

A block can have variants, but every variant is an approved implementation.

---

## 13. Website Generation Pipeline

```text
Business Brain
  ↓
generation strategy
  ↓
structured JSON
  ↓
schema validation
  ↓
business validation
  ↓
block registry
  ↓
render
  ↓
preview
  ↓
publish
```

Website generation must be reproducible and versioned.

---

## 14. Content Engine

The content engine should support:

- editorial strategy;
- keyword/topic planning;
- article briefs;
- article generation;
- review;
- image generation;
- scheduled publication;
- sitemap updates;
- internal links;
- metadata.

**V1 ships a recommended publication cadence of up to 5 articles/day, which the customer
can change.** That is a publication default, not a generation limit — the distinction is
the whole point of the paragraph below, and the two must never be collapsed. §29.3 block 8.

High-volume generation is a capability, not a mandatory publication rate.

The system should optimize for:

- search intent;
- originality;
- usefulness;
- source quality;
- customer-specific evidence;
- internal consistency;
- avoidance of generic AI filler.

A target such as 100 articles/day may be used internally as generation capacity, but publication should be governed by quality and SEO rules.

---

## 15. Social

Supported model:

```text
Customer connects account
  ↓
ZeroCorp creates content
  ↓
Queue
  ↓
Approval or automation
  ↓
Publish
  ↓
Track result
```

OAuth credentials must be encrypted.

Every publication attempt is recorded.

---

## 16. Leads and CRM

> The full V1 lead scope is **§29.3 H — Get Customers, Lite**, which owns the version
> boundary. This section states the progression; §29 states what ships when.

Lead system progression:

### V1

- curated lead lists;
- continuous prospect discovery;
- target definition — niche, countries, industry, company size;
- **basic enrichment** — contact resolution on a prospect already found;
- filtering, search and saved lists;
- CSV export;
- credits and limits.

V1 **finds**. It does not yet contact: campaigns, sequences, CRM and automated follow-up
are V2.

### Later

- **advanced** enrichment — scoring, firmographic append, waterfall providers;
- campaigns;
- CRM;
- pipeline;
- automated follow-up.

Basic enrichment is V1, above. The line between the two is thin and is recorded as an open
item in §29.9.

Do not build a full enterprise CRM before customers need it.

---

## 17. Email

Email infrastructure needs:

- custom domain;
- SPF;
- DKIM;
- DMARC;
- provisioning;
- warm-up;
- sending limits;
- reputation monitoring;
- bounce tracking;
- unsubscribe mechanisms;
- campaign history.

Warm-up must be represented visibly in the customer experience.

---

## 18. Agents

Initial agents:

```text
Content Strategist
Writer
Community Manager
Email Assistant
Prospector
Analyst
Financial Assistant
Legal Information Assistant
```

The legal assistant must clearly state that it provides informational support and not legal advice.

Agents must have:

- defined permissions;
- usage limits;
- auditable actions;
- retry behavior;
- stop conditions;
- human approval for sensitive operations.

---

## 19. Command Center

The customer dashboard should answer:

> What is ZeroCorp doing for me?

Example:

```text
Your Business

Company
Website
Marketing
Leads
Automation
Revenue
```

And an activity feed:

```text
Today

09:42 — New article published
10:15 — 18 prospects discovered
11:02 — 4 LinkedIn posts generated
11:47 — Website analytics updated
12:10 — 3 leads flagged for follow-up
```

---

## 20. Notifications

Channels, and when each ships (§29.3 block 11):

| Channel | Version |
|---|---|
| in-app | V1 |
| email digest | V1 |
| desktop / browser where supported | V1 |
| Telegram | **V2 / V3** |

Telegram is deliberately not V1. It is the light control surface for an autonomous product
(§29.5), and shipping it before there are agents to control gives a founder a second inbox
rather than less work.

Notification system goals:

- reinforce progress;
- surface important action;
- make automation tangible;
- create a daily sense of momentum.

Daily email digest:

> What ZeroCorp did today.

---

## 21. Company Formation

V1 may use a manually assisted operator workflow.

### Internal lifecycle — SUPERSEDED 2026-08-31 (D2)

> **The state machines live in `packages/contracts/src/formation.ts` and are documented in
> `DATABASE.md` §5.** This section no longer defines them.

The nine-state list previously written here was one list trying to be two machines, and it
had no state for a rejected filing. It is replaced by:

```text
formation_orders.status   draft → collecting_documents → verifying_identity
                          → operator_review → ready_to_file → filed → formed
                          filed → rejected → collecting_documents   (reparable)
companies.status          pending → active → delinquent → dissolved
ein_status                not_started → requested → issued          (its own track)
```

Three things changed and each has a reason recorded in `DATABASE.md` §5: a rejected filing
now has somewhere to go, the operator review this section calls for now has a state, and
the EIN no longer holds the order open for the weeks it takes the IRS to answer.

The old list is preserved below for traceability. **It is not current.**

```text
draft
→ documents_collected
→ kyc_passed / verification_complete where applicable
→ submitted
→ filed
→ formed
→ ein_pending
→ ein_issued
→ complete
```

The machine should be API-ready even when the first provider interaction is manual.

Never expose provider-specific mechanics as permanent product architecture.

---

## 22. Legal and Accounting Expansion

These should be product expansion layers, not first-release promises.

Future possibilities:

- lawyer network/partner marketplace;
- legal information assistance;
- document review workflows;
- bookkeeping partnerships;
- accounting integrations;
- annual report workflows;
- franchise-tax reminders;
- invoicing;
- expense tracking;
- tax-preparation partnerships.

The product should be able to point to these capabilities without pretending ZeroCorp itself is a law firm or accounting firm.

---

## 23. Customer Retention Mechanism

The retention loop is:

```text
Company
  ↓
Website
  ↓
Content
  ↓
Leads
  ↓
Email
  ↓
CRM
  ↓
Agents
  ↓
History + business data
  ↓
Harder to leave
```

The goal is not lock-in through inconvenience.

It is earned retention through accumulated operational value.

---

## 24. Milestones

Target milestones:

| Milestone | Illustrative active customers at ~$300 ARPA |
|---|---:|
| $100k ARR | ~28 |
| $250k ARR | ~70 |
| $500k ARR | ~139 |
| $1M ARR | ~278 |

These are planning calculations, not forecasts.

The real KPI is:

```text
MRR
ARPA
gross margin
net revenue retention
churn
CAC
payback period
activation
time-to-value
```

---

## 25. Product Metrics

### Activation

Customer completes:

```text
payment
→ onboarding
→ Business Brain
→ website live
```

### Value

Measure:

- time to website live;
- time to first published content;
- time to first lead;
- time to first automated action.

### Retention

Measure:

- weekly active tenants;
- monthly active tenants;
- number of automated actions;
- customer-generated outcomes;
- churn by plan.

---

## 26. Internationalization

Default:

```text
language: en-US
currency: USD
```

But architecture must support:

- localization;
- currencies;
- timezones;
- date formats;
- number formats.

All customer-visible strings go through i18n.

French and other languages are future locales, not separate product architectures.

---

## 27. Product Non-Goals for Early V1

Do not initially build:

- a general-purpose enterprise CRM;
- a general legal practice platform;
- full accounting software;
- autonomous unrestricted agents;
- arbitrary AI-generated frontend code;
- microservices;
- dozens of low-quality website blocks;
- every social network at once.

---

## 28. Definition of “Good”

A good ZeroCorp release should feel:

- fast;
- coherent;
- calm;
- premium;
- automated;
- trustworthy;
- understandable.

The product should never feel like eight SaaS tools glued together.

---

## 29. Version roadmap — V1 to V5

Added 2026-08-31. **This section owns the version boundary.** It resolves D7, which
recorded that no document in the repository carried a single V1 scope: the archive named
7 modules with day estimates, `PRODUCT_VISION.md` §47 named 17 must-ship items, and this
document had no explicit list at all.

### 29.0 Two things are called Launch, Growth and Autopilot

> 🔴 **A version is not a plan.** §4, §5 and §6 describe the **subscription plans**
> — Launch $99, Growth $399, Autopilot $799 — which a customer chooses. The versions
> below describe **what ZeroCorp can do**, which the whole product advances through.
>
> ```text
> Launch / Growth / Autopilot   a price and an entitlement   §3–§6
> V1 / V2 / V3 / V4 / V5        a product capability         this section
> ```
>
> They share three words and they are different axes. A V1 customer can be on the Growth
> plan. Never say "the Growth version" or "the V2 plan".

### 29.1 Each version is an outcome, not a feature count

This is the part that matters. A version is defined by what becomes true for the
customer, and the feature list is only how that is achieved.

| | The customer can say | The one thing that proves it |
|---|---|---|
| **V1 — BUILD** | *My business exists and is operational.* | A plan the founder approved, executed into a company, a live site, working email and the first list of prospects |
| **V2 — GROW** | *My business has a repeatable customer acquisition system.* | Campaigns that run, a pipeline that moves, numbers that explain both |
| **V3 — AUTOPILOT** | *My business operates with minimal intervention from me.* | A week of work happened and the founder only approved it |
| **V4 — ADMINISTER** | *My business administration is organized and monitored.* | No deadline was missed, and the accountant had what they needed |
| **V5 — PLATFORM** | *ZeroCorp is the operating infrastructure around my business.* | Someone else built on top of it |

> "V1 = 12 features, V2 = 20 features" tells nobody whether V1 is finished.
> "My business exists and is operational" does.

### 29.2 What ZeroCorp is at twelve months

A founder arrives with an idea and says **"Build my business."** By then ZeroCorp must:

```text
Create and structure       Business Brain · formation · EIN · documents · brand
                           website · domain · email · SEO · blog
Find customers             prospect database · search and filters · enrichment
                           export · campaigns · follow-up · social · CRM and pipeline
Do the work                content agent · social agent · prospector · email assistant
                           analyst · workflows · Telegram · notifications · daily reports
Run the business           documents · compliance · deadlines · billing · credits
                           usage · accountant and legal partnerships
Show it in one place       Overview · Company · Website · Content · Growth · Agents
                           Automation · Notifications · Compliance · Billing
```

That is the destination. V1 to V5 is the order it is reached in.

---

### 29.3 V1 — BUILD

> **Start from zero. Become operational.**

V1 must be **sellable and deliver a complete transformation**, not a prototype. The test
is not "does it demo" but "would a founder pay and get a business".

#### It is one workflow, not twelve products

The thirteen blocks below are stages of a single journey. Anyone reading them as a feature
list will build twelve disconnected tools, which is the failure §28 names.

```text
Understand → Plan → Build → Launch → Find customers
```

```text
FREE ASSESSMENT
      ↓
AI UNDERSTANDS THE BUSINESS
      ↓
RECOMMENDED PLAN  ──→  PRICING  ──→  PAYMENT
      ↓
DEEP ONBOARDING
      ↓
BUSINESS BRAIN
      ↓
ZEROCORP EXECUTES
      ↓
COMPANY ─┐ BRAND ─┐ WEBSITE ─┐ DOMAIN ─┐ EMAIL ─┐ CONTENT ─┐ SEO ─┐ LEADS ─┘
      ↓
COMMAND CENTER
```

---

**0 · Free Business Assessment** — *before payment*

```text
Landing → "Tell us about your business" → 3–5 questions → text, voice optional
→ AI analysis → where you are · where you want to go · what is missing
→ recommended ZeroCorp plan → pricing
```

Three to five questions, and **no expensive free onboarding**. The assessment exists to
qualify and to produce a recommendation the visitor recognises as theirs — not to deliver
the product for free. Everything costly happens after payment, in block 2.

**1 · Plan and checkout**

The answer to *"is this a new business or an existing one?"* decides the whole path.

```text
New business       → Business Launch Setup      $997
Existing business  → Business Activation Setup  ~$497   🟠 TO CONFIRM
                     then a subscription: $99 / $399 / $799
```

> 🟠 **The second setup price is a hypothesis, not a decision.** §3 already marks all
> pricing as a hypothesis to validate against willingness-to-pay, gross margin and
> conversion. `$497` is a placeholder for the activation path and must be **configurable,
> never hard-coded**. Recorded as an open item.

**2 · Deep onboarding** — *after payment*

identity · current situation · goals · documents · existing website · brand assets · voice
· follow-up questions **only where needed**

This is where the real cost sits, and it sits behind the paywall on purpose. It produces
the **Business Brain**, which becomes the single upstream source for everything generated
afterwards (§11, and a ZeroCorp invariant).

**3 · Business Plan** — *the heart of V1*

```text
Your business → Assessment → Recommended plan
```

The customer can **accept · edit · ask the AI to edit · add a step · remove a step ·
change a priority**, then:

```text
Approve Plan
```

> This block is what stops ZeroCorp being a generator. The plan is the artefact the
> customer owns, argues with and signs off — and everything ZeroCorp executes afterwards
> traces back to a step they approved.

It also carries the product's approval doctrine into V1: an agent never performs a
privileged action without explicit permission. Here the permission is the approved plan.

**4 · Company** — *only if needed*

New business:
structure choice · state · formation · documents · identity · signature · tracking · EIN ·
deadlines

Existing business:
**connect or import the existing company** — never re-form what already exists.

The state machines are decided (D2), live in `packages/contracts/src/formation.ts` and are
documented in `DATABASE.md` §5. See §21.

```text
formation_orders   draft → collecting_documents → verifying_identity → operator_review
                   → ready_to_file → filed → formed
companies          pending → active → delinquent → dissolved
ein_status         not_started → requested → issued
```

> An imported company enters at `companies.status = active` with **no formation order at
> all**. A formation order is the record of work ZeroCorp did; inventing one for a company
> formed elsewhere would put a fiction in the audit trail.

**5 · Brand**

name · positioning · ICP · value proposition · tone · logo · colours · basic brand
foundation

**6 · Website**

generation · pages · blocks · variants · responsive · preview · editing · publication ·
domain · DNS · basic technical SEO

Sites are data, not code — one renderer, one block registry, never a per-customer
application. `DESIGN_SYSTEM.md` §20 owns the block system.

**7 · Email**

domain · DNS · SPF · DKIM · DMARC · mailboxes · forwarding · warm-up · reputation

**8 · Content engine**

SEO research · keyword strategy · content plan · editorial calendar · article generation ·
editing · approval · publication · images · metadata

```text
Recommended publication cadence: up to 5 articles/day, customer-adjustable
```

> This is a **publication** default, not a generation limit, and the two must not be
> confused. §14 already holds the doctrine: high-volume generation is a capability, not a
> mandatory publication rate, and publication is governed by quality and SEO rules. Five a
> day is the recommended ceiling ZeroCorp ships with; the customer moves it.

**9 · Get Customers — Lite**

> **DECIDED: the first acquisition brick ships in V1, not V2.** A founder who finishes V1
> with a company, a site and no prospects has a business that exists and cannot sell.
> "Operational" has to include the first customer path.

**V1 finds. It does not yet contact.**

```text
target definition · niche · countries · industry · company size
continuous prospect discovery · basic enrichment
email · phone where appropriate and available
search · filtering · saved lists · CSV export
```

> 🟠 **Basic enrichment moved into V1**, where §29.4 previously placed all enrichment in
> V2. "Basic" needs a line: it is contact resolution on a prospect ZeroCorp already found
> — not scoring, not firmographic append, not waterfall providers, which stay V2. The
> boundary is thin and is recorded as an open item.

Not in V1: campaigns · sequences · full CRM · automated follow-up.

**10 · Dashboard / Command Center**

Answers one question: **What is ZeroCorp doing for me?**

Company · Website · Email · Content · SEO · Leads · launch progress · **tasks requiring
attention** · activity · notifications, over a timeline:

```text
Website published
12 prospects discovered
3 articles published
DNS configured
…
```

§19 and §20 own the Command Center and digest principles.

**11 · Notifications**

```text
V1        in-app · email digest · browser and desktop where relevant
V2 / V3   Telegram
```

> Telegram is deliberately **not** V1. It is the light control surface for an autonomous
> product (§29.5), and shipping it before there are agents to control gives a founder a
> second inbox rather than less work.

**12 · Admin console**

> **Required in V1, not later.** Without it every formation, refund and support request is
> a manual database edit — which does not scale past the first customers, and is how
> identity documents get mishandled.

customers · tenants · formation orders · documents · company status · payments ·
subscriptions · credits · support · **secure impersonation** · audit · failed jobs ·
retries

Impersonation is scoped and audited. `CLAUDE_CODE_RULES.md` and the tenant-isolation tests
apply to the console exactly as they apply to the product.

---

**What the customer buys at V1**

```text
Setup ($997 new · ~$497 existing) + subscription
= business understood + planned + built + online + operational
+ initial customer acquisition capability
```

---

### 29.4 V2 — GROW

> **Find customers, contact them and create opportunities.**

Everything in V1, plus:

**Lead intelligence** — **advanced** enrichment · scoring · deduplication · segmentation ·
better search · dynamic lists

Basic enrichment — contact resolution on a prospect already found — ships in V1 (§29.3
block 9). What lands here is everything beyond that: scoring, firmographic append,
waterfall providers.

**Outreach** — email campaigns · sequences · follow-ups · templates · unsubscribe ·
bounce handling · campaign analytics

**Social** — account connection · content publishing · social calendar · scheduling ·
analytics

**CRM** — contacts · companies · opportunities · stages · notes · activities · pipeline ·
basic automations

**Creative engine** — image generation · templates · social formats · ad creatives

**Analytics** — traffic · content · leads · campaigns · conversion · channel performance

§27 still applies: this is not a general-purpose enterprise CRM.

---

### 29.5 V3 — AUTOPILOT

> **Stop operating the business manually.**

Everything in V2, plus:

**Agents** — Content Strategist · Writer · Community Manager · Prospector · Email
Assistant · Analyst · Financial Assistant · Legal Information Assistant (§18)

**Automation** — triggers · schedules · workflows · retry · **approval gates** · stop
conditions · budgets · permissions

The approval gates, budgets and permissions are not optional extras. A ZeroCorp invariant
is that an agent never performs a privileged action without explicit permission.

**Autonomy — a week under autopilot**

```text
Monday      strategist plans content
Tuesday     writer creates the article
Wednesday   social agent creates posts
Thursday    prospector finds leads
Friday      analyst summarizes performance
```

**Interface** — Agent Center: runs · approvals · activity · costs · limits · logs.
Telegram: daily digest · actions · approvals · alerts · commands.

---

### 29.6 V4 — ADMINISTER

> **Run the business responsibly.**

**Compliance** — deadlines · annual filings · state obligations · document collection ·
reminders · compliance dashboard

**Finance** — invoices · expenses · revenue overview · financial summaries

**Professional network** — accountant collaboration · tax professional · lawyer network ·
document sharing · task handoff

The governing principle, unchanged from §22:

> **Become the operational system around the accountant before trying to become the
> accountant.**

---

### 29.7 V5 — PLATFORM

> **ZeroCorp becomes infrastructure.**

public API · mobile · partner API · accountant portal · lawyer portal · enterprise ·
affiliate platform · integrations ecosystem · marketplace · advanced analytics · advanced
AI intelligence

**This is the trigger for `apps/api`.** [ADR 0001](./adr/0001-runtime-topology.md) already
defines `apps/api` as the public API added on trigger — never a BFF for `apps/app`. V5 is
that trigger, and until then `apps/api` is not deployed.

---

### 29.8 One line each

```text
V1  BUILD        Create the business.
V2  GROW         Find and acquire customers.
V3  AUTOPILOT    Let ZeroCorp do the work.
V4  ADMINISTER   Manage compliance and business administration.
V5  PLATFORM     Make ZeroCorp infrastructure for modern businesses.
```

### 29.9 What is still missing from this section

Recorded honestly rather than left implied:

- **No estimates.** D7 also noted that the current V1 carries no time estimate of any
  kind. Ten lettered blocks A to J is a scope, not a plan, and the feasibility of
  "$100k ARR as the first milestone" still cannot be assessed from this repository.
- **No per-line owner.** Solo for now, which makes it moot — until it is not.
- **The Business Activation Setup price** (~$497, §29.3 block 1) is a placeholder. §3
  already marks all pricing as hypothesis; this one has not even been through that.
- **The basic-vs-advanced enrichment line** (§29.3 block 9) is thin. "Contact resolution
  on a prospect we already found" is the current wording, and it will be argued about the
  first time a provider bills per enrichment.
