> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** vision, positioning, business model, pricing strategy, ARR milestones, roadmap phases, moat, success metrics. For architecture, database, design-system or engineering detail, the specialized documents below take precedence.
>
> When this document conflicts with anything under `docs/archive/`, **this document wins**.
> See [`docs/README.md`](./README.md) for the full documentation hierarchy and topic ownership map.
>
> Last reorganized: 2026-08-30

---

# ZeroCorp — Product Vision, Business Model, Architecture & Design Blueprint

**Document type:** Master product blueprint for product, design, architecture and Claude Code implementation

**Status:** Proposed V1 — strategic baseline to validate and refine through customer feedback

**Primary market:** International, English-first, USD-first

**Business model:** Bootstrap / capital-efficient SaaS + service layer

**North-star ambition:** Build a business operating system that can reach **$100k ARR as the first major validation milestone** and pursue **$1M ARR within 12 months**, without requiring an agency-like operating model.

---

## 0. Executive decision summary

ZeroCorp should not be built as an AI website builder, a generic LLC formation website, or a bundle of disconnected automation features.

ZeroCorp should be built as a **Business Launch & Operating System** for founders, non-resident entrepreneurs, digital nomads, agencies, consultants and small international businesses that want to launch and run a US-based digital business with as little operational friction as possible.

The core promise is:

> **Tell us about your business. We build the foundation for you — then ZeroCorp helps run it.**

The product has three strategic layers:

1. **Business Launch** — create and establish the business foundation.
2. **Business Growth** — build the marketing, prospecting and operating infrastructure.
3. **Business Autopilot** — use agents and automation to execute recurring digital operations.

The one-time setup fee and recurring subscription serve different purposes and must remain clearly separated:

- **$997 setup** = initial business creation / launch work.
- **Monthly plan** = continuous software, infrastructure, automation and operating value.
- **Usage / credits** = variable AI and automation consumption where relevant.

The pricing model must evolve around **ARPA (average revenue per account)**, not around maximizing the number of low-value accounts.

Recommended initial pricing hypothesis:

| Layer | Initial price | Role |
|---|---:|---|
| Setup | **$997 one-time** | Launch and initial business foundation |
| Launch | **$99/mo** | Digital foundation + website + content basics |
| Growth | **$399/mo** | Leads + CRM + outbound/email + social + growth automation |
| Autopilot | **$799/mo** | Agents + advanced automation + intelligence |
| Usage | Variable | AI-heavy / high-volume consumption |

These prices are **hypotheses to validate**, not permanent commitments. The product should be architected so pricing and entitlements can change without code rewrites.

---

# 1. Product thesis

## 1.1 What ZeroCorp actually does

A customer arrives with a business idea, an existing business, or a business they want to establish in the United States.

The customer should feel that they are not buying a collection of tools. They are handing the operational burden to a system.

The desired transformation is:

```text
Founder has an idea / business
        ↓
Tells ZeroCorp what the business is
        ↓
ZeroCorp understands the business
        ↓
ZeroCorp builds the business foundation
        ↓
ZeroCorp launches the digital infrastructure
        ↓
ZeroCorp keeps the business active
        ↓
ZeroCorp progressively automates operations
```

The product should make the following feeling possible:

> **“I described my business once, and ZeroCorp turned it into an operating business.”**

---

## 1.2 What ZeroCorp is not

ZeroCorp is not primarily:

- a website builder;
- an AI copywriter;
- an LLC filing form;
- a social media scheduler;
- an email marketing tool;
- a CRM;
- an AI agent playground.

All of those can exist inside the product.

None of them should define the product.

---

## 1.3 Category ambition

A useful internal category definition is:

> **Business Operating System for globally minded founders.**

Alternative positioning language to test:

> **Launch your US business. Let ZeroCorp run the digital operation.**

> **Tell us about your business. We build the foundation for you.**

> **Describe your business. We build the infrastructure. You run the vision.**

> **From idea to operating business.**

> **Your business, launched and operated from one place.**

The final public positioning should be tested with real prospects rather than selected purely by taste.

---

# 2. Customer and market focus

## 2.1 Initial customer profile

The product is initially strongest for founders who:

- are international or non-US residents;
- want a US business entity or already have one;
- run digital businesses;
- can operate remotely;
- want to launch agencies, consulting businesses, software businesses, online services, creator businesses or other digital-first businesses;
- value speed and convenience;
- are willing to pay for operational leverage.

Potential high-value personas:

### Persona A — Digital nomad founder

Wants a legitimate business foundation without assembling ten different providers.

### Persona B — Agency founder

Needs company + website + lead generation + email + client acquisition systems.

### Persona C — International consultant

Needs company + professional web presence + content + lead generation + CRM.

### Persona D — Existing small business

Already has a company and wants ZeroCorp to consolidate and automate digital operations.

### Persona E — Serial founder / operator

Wants to launch multiple brands/businesses with repeatable infrastructure.

The product should not force every user into the same journey.

---

# 3. Product architecture at the business level

ZeroCorp should be designed as three progressively valuable layers.

## Layer 1 — BUSINESS LAUNCH

The customer goes from "I need a business" to "my business exists and has a professional digital foundation."

Core capabilities:

- company formation workflow;
- EIN workflow / tracking;
- business information collection;
- brand profile;
- domain setup;
- website generation;
- professional email infrastructure;
- initial content setup;
- launch checklist;
- document vault;
- status tracking;
- notifications.

## Layer 2 — BUSINESS GROWTH

The customer goes from "my business exists" to "my business is actively acquiring attention and prospects."

Core capabilities:

- content strategy;
- blog;
- SEO content engine;
- social publishing;
- prospect database;
- lead enrichment;
- email campaigns;
- prospect follow-ups;
- CRM / pipeline;
- analytics;
- activity feed;
- growth reporting.

## Layer 3 — BUSINESS AUTOPILOT

The customer goes from "I operate these systems" to "these systems operate themselves within controlled limits."

Core capabilities:

- specialized agents;
- workflow automation;
- lead follow-up;
- content planning and execution;
- daily reporting;
- inbox assistance;
- financial monitoring;
- compliance reminders;
- business intelligence;
- Telegram control;
- approval workflows;
- advanced automations.

---

# 4. Setup fee vs subscription — final conceptual model

## 4.1 The setup fee remains

The $997 setup fee should remain.

The important clarification is that it is **not another subscription tier**.

The mental model is:

```text
$997 one-time
    ↓
ZeroCorp launches the business foundation
    ↓
$99 / $399 / $799 monthly
    ↓
ZeroCorp continues operating the selected layer
```

The setup is therefore not “$997 + a second Launch package that repeats the LLC.”

Instead, the setup should include the **initial transformation**, while the recurring plans represent **ongoing operation**.

---

## 4.2 What the $997 setup should include

The exact commercial bundle should be confirmed with provider costs and gross-margin targets, but the conceptual setup package is:

- business formation workflow / provider handoff;
- EIN workflow / tracking where applicable;
- collection and verification of required business information;
- business profile / Business Brain initialization;
- domain provisioning or domain setup assistance;
- brand foundation;
- initial website generation and launch;
- foundational email/domain configuration;
- launch dashboard;
- document vault;
- onboarding and first configuration;
- initial content / SEO foundation.

The setup is sold as:

> **We build the foundation.**

The monthly plan is sold as:

> **We keep the foundation running and growing.**

---

# 5. Pricing architecture

## 5.1 Recommended initial plans

### Launch — $99/month

Purpose:

> **Keep the business present, professional and active online.**

Core value:

- hosted website;
- custom domain support;
- website editor;
- blog engine;
- basic automated content generation;
- basic SEO tooling;
- website analytics;
- business profile / Business Brain;
- basic notifications;
- infrastructure maintenance;
- core support.

This plan intentionally stays close to the original $99 concept because the perceived value of a continuously maintained site + blog + basic content engine can be clear without requiring a heavy sales process.

### Growth — $399/month

Purpose:

> **Turn the digital foundation into a customer acquisition system.**

Core value:

- everything in Launch;
- prospect database access;
- lead filters;
- lead enrichment;
- CRM / pipeline;
- outbound email infrastructure;
- campaign and sequence management;
- prospect follow-ups;
- social publishing;
- content calendar;
- advanced analytics;
- growth reports;
- additional usage / credits;
- workflow automation.

The exact $399 price should be validated against the actual amount of acquisition value the system delivers. A lower test price such as $299 may be used during early validation if required.

### Autopilot — $799/month

Purpose:

> **Let ZeroCorp execute recurring business operations.**

Core value:

- everything in Growth;
- agent runtime;
- specialized agents;
- advanced automations;
- daily business reports;
- lead follow-up automation;
- inbox assistant;
- advanced content orchestration;
- financial monitoring / collection intelligence;
- compliance reminders;
- Telegram control;
- approval workflows;
- higher usage limits;
- advanced intelligence.

The $799 level should not be sold merely as “more AI.” It must represent **measurable operating leverage**.

---

## 5.2 Usage-based monetization

ZeroCorp should maintain a credit / usage system from the beginning.

Potential metered resources:

- LLM usage;
- image generation;
- deep enrichment;
- high-volume prospect discovery;
- agent executions;
- premium automation runs;
- outbound message volume;
- advanced research jobs.

The product should not expose every internal cost to the customer.

Instead, it should expose a simple entitlement model:

```text
Included usage
     ↓
Usage meter
     ↓
Credits remaining
     ↓
Optional top-up / plan upgrade
```

Internally, retain full cost accounting.

---

## 5.3 Why the setup fee and recurring revenue must remain separate

The setup fee creates cash to fund acquisition and onboarding operations.

ARR comes from the subscription layer.

Therefore:

```text
Setup revenue ≠ ARR
```

The business must be measured primarily on:

- MRR;
- ARR;
- ARPA;
- gross margin;
- churn;
- retention;
- expansion revenue;
- activation;
- payback period.

---

# 6. ARR milestones

The $100k ARR milestone is the first major proof point.

The $1M ARR milestone is the 12-month ambition.

Recommended milestone structure:

| Milestone | Approx. ARR | Illustrative active customers |
|---|---:|---:|
| M0 — Validation | $0–25k | 0–10 |
| M1 — Product proof | **$100k ARR** | ~30–50 |
| M2 — Repeatability | **$250k ARR** | ~80–120 |
| M3 — Scale | **$500k ARR** | ~150–220 |
| M4 — North Star | **$1M ARR** | ~300–500 |

The actual customer requirement depends on product mix.

A reasonable mixed-plan scenario:

```text
60% Launch @ $99
30% Growth @ $399
10% Autopilot @ $799

Illustrative ARPA ≈ $259/month

$100k ARR ≈ 33 active customers
$500k ARR ≈ 161 active customers
$1M ARR ≈ 322 active customers
```

This is one reason ARPA is strategically important.

The objective is not “get thousands of users.”

The objective is:

> **Get a few hundred businesses that genuinely rely on ZeroCorp.**

---

# 7. Product experience — “Launch your business”

The onboarding should not be described internally as a boring form sequence.

The mental model is:

# LAUNCH YOUR BUSINESS

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

The customer should see meaningful progress continuously.

Examples of product copy:

> **We are already building your website.**

> **Your business profile is ready for review.**

> **Your website is live.**

> **Your domain is connected.**

> **Your marketing infrastructure is ready.**

> **Your email domain is warming up.**

> **Your company formation is being processed.**

The experience should make external waiting periods feel like visible progress rather than dead time.

---

# 8. Voice-first onboarding and the Business Brain

## 8.1 Core principle

The user should not start by filling a huge questionnaire.

They should start by explaining the business naturally.

Primary experience:

> **Tell us about your business.**

The user can speak for several minutes.

The system:

```text
Voice
 ↓
Transcription
 ↓
Structured extraction
 ↓
Business Brain
 ↓
AI confidence / missing fields
 ↓
Human review
 ↓
Approved source of truth
```

A normal form remains available as a fallback.

---

## 8.2 Business Brain

The Business Brain is a first-class product entity.

It should eventually capture:

- legal business information;
- business description;
- business model;
- offers;
- target audience;
- ICP;
- market;
- geography;
- positioning;
- value proposition;
- competitors;
- differentiators;
- tone of voice;
- brand personality;
- keywords;
- content themes;
- products/services;
- pricing information;
- testimonials;
- case studies;
- brand assets;
- target languages;
- source documents;
- founder-provided information;
- AI-inferred information;
- confidence level;
- approval state.

Important rule:

> **AI inference must never silently become authoritative business truth.**

Separate:

```text
source_value
inferred_value
approved_value
confidence
```

This is critical for quality.

---

# 9. Website system — one engine, many sites

## 9.1 Architecture principle

**Sites are data, not code.**

There must be one renderer and one component library.

```text
Customer A ─┐
Customer B ─┼──> Domain / Host Resolution
Customer C ─┘              ↓
                      Next.js renderer
                             ↓
                        Site data JSON
                             ↓
                       Component registry
                             ↓
                        Design system
```

Never generate a separate application for every customer.

Never generate arbitrary production HTML from an LLM.

---

## 9.2 Structured page representation

Conceptual model:

```json
{
  "theme": "bold-dark",
  "blocks": [
    {
      "type": "hero",
      "variant": "split-image",
      "content": {
        "title": "...",
        "subtitle": "...",
        "cta": "..."
      }
    },
    {
      "type": "services",
      "variant": "three-column",
      "items": []
    }
  ]
}
```

The LLM may choose:

- block type;
- variant;
- content;
- ordering;
- approved style tokens;
- image instructions.

The LLM may not invent:

- arbitrary CSS systems;
- arbitrary component structures;
- arbitrary interactions;
- arbitrary layout primitives;
- arbitrary design tokens.

---

# 10. Website block library

## 10.1 Initial target

Start with **12 excellent blocks** and expand toward **20 high-quality blocks**.

Suggested set:

1. Hero
2. Logos / trust strip
3. Features
4. Services
5. Results / statistics
6. Testimonials
7. Process
8. Pricing
9. FAQ
10. Team
11. CTA
12. Contact
13. About
14. Gallery
15. Comparison
16. Case study
17. Lead capture / quote form
18. Announcement banner
19. Before / after
20. Featured content

Do not build all 20 at once merely to satisfy a list.

Build the first 12 to a very high standard, then add the remaining blocks according to customer demand.

---

## 10.2 Variants per block

Each block should support multiple approved variants.

Target:

- start with ~10 variants for major blocks;
- expand toward 10–20 variants where useful;
- avoid meaningless variants that only change tiny spacing details.

Example:

```text
Hero
 ├── centered
 ├── split image
 ├── split product
 ├── video
 ├── editorial
 ├── large type
 ├── dark cinematic
 ├── minimal
 ├── proof-first
 └── conversion-first
```

A site becomes unique through **composition of controlled primitives**, not through uncontrolled generation.

---

## 10.3 Block registry

Every block should be registered in a central system.

Conceptual shape:

```ts
BlockRegistry = {
  hero: {
    variants: [...],
    schema: ...,
    component: ...,
  },
  services: {
    variants: [...],
    schema: ...,
    component: ...,
  },
}
```

The registry should be the canonical source used by:

- renderer;
- editor;
- AI generation;
- validation;
- previews;
- analytics;
- tests.

---

# 11. Design System — build before product screens

The visual system must be established **before** large-scale UI implementation.

Claude Code must not be allowed to invent a new visual language screen by screen.

The rule is:

> **Claude Code implements the established design system. It does not become the art director.**

---

## 11.1 Design system documentation

Create and maintain:

```text
/docs/DESIGN_SYSTEM.md
```

It should define at least:

1. Design philosophy
2. Brand personality
3. Color system
4. Typography
5. Spacing
6. Radius
7. Borders
8. Shadows
9. Elevation
10. Motion
11. Icons
12. Grid
13. Breakpoints
14. Accessibility
15. Component rules
16. Form rules
17. Table rules
18. Dashboard rules
19. Empty states
20. Loading states
21. Error states
22. AI states
23. Notifications
24. Responsive behavior
25. Website renderer rules
26. Do / Don't examples

---

## 11.2 Foundations

Define explicitly:

- color tokens;
- semantic colors;
- typography scale;
- font weights;
- line heights;
- spacing scale;
- radius scale;
- shadow scale;
- border system;
- icon sizing;
- component heights;
- motion durations;
- focus states;
- disabled states;
- responsive rules.

No hard-coded values should proliferate without a design-system reason.

---

# 12. Component sourcing strategy

ZeroCorp should not ask an AI coding model to invent UI components from scratch when a strong implementation already exists.

The workflow should be:

```text
Identify required component
        ↓
Research high-quality implementation
        ↓
Verify license
        ↓
Copy / adapt into internal component library
        ↓
Normalize to ZeroCorp design tokens
        ↓
Document usage
        ↓
Register as canonical component
```

Candidate ecosystems may include high-quality open-source component libraries and registries, provided the license and maintenance status are reviewed before adoption.

For every external component, record:

```text
name
source
version
license
attribution requirement
modifications
owner
review date
```

Never copy unknown code into the core product without review.

---

# 13. Foundations and product components

## 13.1 Foundation components

Initial foundation set:

- Button
- IconButton
- Input
- Textarea
- Select
- Combobox
- Checkbox
- Radio
- Switch
- Slider
- Date picker
- File upload
- Avatar
- Badge
- Tooltip
- Popover
- Dialog
- Drawer
- Dropdown
- Tabs
- Breadcrumbs
- Separator
- Skeleton
- Spinner
- Toast
- Alert

These should be canonical components.

---

## 13.2 Product components

Core product-specific components:

- DataTable
- StatusBadge
- StatusTimeline
- ActivityFeed
- ProgressStepper
- BusinessHealthCard
- CreditMeter
- AgentRunCard
- AIApprovalPanel
- ContentCalendar
- BlockEditor
- WebsitePreview
- DomainStatusCard
- EmailWarmupStatus
- FormationStatus
- DocumentVault
- ProspectTable
- LeadPipeline
- WorkflowBuilder
- NotificationCenter
- UsageBreakdown
- BillingCard
- DailySummary
- CommandMenu
- Search palette

Every repeated pattern should become a reusable component.

---

# 14. Layout patterns

Canonical layouts should be defined before individual screens.

## 14.1 Main dashboard

```text
Sidebar
  ↓
Top navigation
  ↓
Page header
  ↓
Primary content
```

## 14.2 Onboarding

```text
Progress / steps
        ↓
Focused content area
        ↓
Primary action
        ↓
Contextual help
```

## 14.3 Editor

```text
Navigation
        ↓
Canvas / preview
        ↓
Contextual editing panel
```

## 14.4 Settings

```text
Settings navigation
        ↓
Section header
        ↓
Settings cards / forms
```

## 14.5 Launch checklist

```text
Business setup
        ↓
Progress status
        ↓
Completed / pending / blocked actions
```

Do not invent a new page architecture for every feature.

---

# 15. AI visual freedom rules

## Rule 1
AI may compose approved components.

## Rule 2
AI may choose approved variants.

## Rule 3
AI may choose approved design tokens.

## Rule 4
AI may generate copy and image instructions.

## Rule 5
AI may not invent arbitrary visual primitives.

## Rule 6
AI may not bypass the component registry.

## Rule 7
AI may not introduce a new pattern when an existing canonical pattern can solve the problem.

## Rule 8
A new visual component requires human/design-system approval and becomes part of the canonical library only after review.

---

# 16. Dashboard — the product should feel alive

The dashboard should be a **Command Center**, not an administrative spreadsheet.

Desired message:

> **Your business is running.**

Possible daily summary:

```text
Today

✓ Website published 1 new article
✓ 18 prospects matched your ICP
✓ 4 LinkedIn posts prepared
✓ 2 follow-ups sent
✓ Email reputation improved
✓ Company filing status updated
```

The user should be able to understand:

- what happened;
- what is happening;
- what needs attention;
- what is going to happen next.

---

# 17. Activity feed and gratification loop

This is not decorative.

It is a retention mechanism.

The product should continuously prove that value is being produced.

Examples:

> ZeroCorp published a new article.

> ZeroCorp found 18 companies matching your ICP.

> ZeroCorp generated 4 social posts.

> ZeroCorp detected a response from a prospect.

> Your website received 143 visits this week.

> Your company formation status changed.

> Your email infrastructure completed another warm-up milestone.

Every meaningful background task should eventually produce a user-visible event.

---

# 18. Notification system

Notifications should exist across multiple channels.

## In-app

Permanent notification center with unread count.

## Desktop / browser

Browser notifications for relevant events.

## Email

A daily business summary should be available.

Example:

> **Your ZeroCorp Daily Report**
>
> 18 prospects discovered
> 4 posts published
> 2 follow-ups completed
> 1 important action required
>
> View your business dashboard.

## Telegram

Optional connection for customers who want an operational control channel.

Example commands:

```text
/status
/report
/approve
/leads
/content
```

The notification system should be a shared infrastructure layer, not separate implementations per feature.

---

# 19. Content engine and SEO strategy

The content engine should be designed to support **very high production capacity**.

However:

> **100 articles/day is a generation capacity target, not a blind publishing target.**

Google currently emphasizes helpful, reliable, people-first content and warns against generating many pages primarily to manipulate rankings, including scaled generation with AI. Therefore ZeroCorp's content engine must contain quality controls, originality requirements, evidence/source handling and publication governance.

---

## 19.1 Content pipeline

```text
Business Brain
     ↓
Audience / ICP
     ↓
Topic universe
     ↓
Search intent
     ↓
Content clusters
     ↓
Editorial plan
     ↓
Research
     ↓
Draft
     ↓
Evidence / source validation
     ↓
Originality / value check
     ↓
Internal links
     ↓
Human review when required
     ↓
Publish
     ↓
Measure
     ↓
Improve / consolidate / retire
```

---

## 19.2 Content quality gates

Before publication, the system should score:

- search intent fit;
- usefulness;
- originality;
- business-specificity;
- factual reliability;
- source quality;
- duplication risk;
- cannibalization risk;
- topical relevance;
- readability;
- internal linking quality;
- commercial relevance;
- update requirements.

Low-score content should be:

- improved;
- merged;
- queued for review;
- or not published.

---

## 19.3 High-volume content architecture

ZeroCorp should support generating many drafts in parallel while controlling publication.

A healthy system looks like:

```text
100 candidate pieces generated
        ↓
Quality classification
        ↓
20 strong candidates
        ↓
5 immediately publishable
        ↓
Others improved / merged / scheduled
```

The number is illustrative, not a mandated ratio.

The core principle is:

> **Optimize for useful indexed assets, not raw article count.**

---

# 20. Acquisition content strategy

The acquisition engine can target clusters such as:

- How to start a US LLC as a non-resident
- How to create a company as a digital nomad
- How to build a remote-first agency
- How to create an autonomous AI business
- How to operate a US business remotely
- US company infrastructure for international founders
- Website and marketing automation for agencies
- AI business operations
- US business setup comparisons
- Business formation questions

These topics should become structured content clusters, not hundreds of disconnected pages.

---

# 21. Business formation module

The existing document's V1 manual-assisted approach remains valid.

Architecture:

```text
Customer onboarding
      ↓
Document collection
      ↓
Review
      ↓
Admin / operator queue
      ↓
Provider submission
      ↓
Status updates
      ↓
Documents
      ↓
Customer visibility
```

The critical technical decision:

> **Build the workflow as if a provider API exists, even when V1 is manually operated.**

That means the business logic should depend on a provider abstraction, not on a human operator screen.

Conceptual interface:

```ts
FormationProvider
  createOrder()
  submitOrder()
  getStatus()
  listDocuments()
  cancelOrder()
```

V1 implementation:

```text
ManualProvider
```

V2 implementation:

```text
ApiFormationProvider
```

No domain-model rewrite should be required.

---

# 22. Legal and compliance layer — long-term direction

ZeroCorp should **not pretend to be a law firm or tax advisor** unless the operating model and jurisdictional requirements explicitly support that.

The right long-term direction is a combination of:

1. software;
2. structured compliance workflows;
3. verified external information;
4. partner network;
5. escalation to qualified professionals.

Potential later features:

- compliance calendar;
- state filing reminders;
- document deadlines;
- registered-agent reminders;
- legal document workflows;
- legal knowledge assistant with source citations;
- professional referral marketplace;
- lawyer review add-ons;
- accountant / tax professional referrals.

The AI should clearly distinguish:

```text
Information
Guidance
Workflow assistance
Professional advice
```

The product should not blur these categories.

---

# 23. Accounting and finance layer — long-term direction

Accounting is strategically valuable because it can increase retention, but it should be introduced carefully.

Potential roadmap:

### Phase 1

- expense visibility;
- invoice tracking;
- payment status;
- revenue reporting.

### Phase 2

- invoicing;
- payment links;
- recurring invoices;
- receivables reminders.

### Phase 3

- accounting integrations;
- bookkeeping partnerships;
- tax preparation partnerships;
- financial analytics.

The principle is:

> **Become the operational system around the accountant before trying to become the accountant.**

---

# 24. CRM and lead system

The CRM should remain intentionally minimal at first.

Core entities:

```text
Lead
Company
Contact (where legally appropriate)
Opportunity
Activity
Sequence
Task
Note
```

Pipeline:

```text
New
 ↓
Qualified
 ↓
Contacted
 ↓
Engaged
 ↓
Opportunity
 ↓
Won / Lost
```

The product should focus on useful action rather than reproducing every feature of a legacy CRM.

---

# 25. Email infrastructure

The product needs a distinction between:

1. ZeroCorp's own transactional email;
2. customer business email;
3. customer outbound marketing / prospecting.

These should never be mixed operationally.

Customer infrastructure should include:

- domain configuration;
- SPF;
- DKIM;
- DMARC;
- mailbox provisioning;
- warm-up state;
- sending limits;
- reputation monitoring;
- failure tracking;
- unsubscribe handling;
- abuse controls.

The product must communicate that warm-up is a process, not an instant switch.

---

# 26. Social publishing

Build platform adapters rather than one giant social module.

Conceptual abstraction:

```text
SocialPublisher
   ├── LinkedInPublisher
   ├── MetaPublisher
   ├── XPublisher
   └── TikTokPublisher
```

Each adapter should support:

- OAuth;
- token refresh;
- validation;
- publish;
- status;
- retry;
- error mapping.

The system should never create social accounts automatically where platform rules prohibit doing so.

Third-party OAuth approval is an external project dependency and must be started early.

---

# 27. Agents architecture

Agents are a capability layer, not the foundation of the entire product.

## 27.1 Agent abstraction

All agent execution must pass through ZeroCorp's own interface.

Conceptual model:

```text
ZeroCorp Agent Runtime Interface
            ↓
       Provider / Harness
            ↓
   Hermes / another runtime
```

The application must not directly depend on a single agent framework.

---

## 27.2 Initial agent catalog

Potential agents:

- Content Strategist
- Writer
- Community Manager
- Prospecting Agent
- Follow-up Agent
- Inbox Assistant
- Analyst
- Finance Assistant
- Compliance Reminder Assistant

Potential future agents:

- Sales Assistant
- Customer Success Assistant
- Research Agent
- Competitor Intelligence Agent
- Proposal Agent

Every agent requires:

- clear permissions;
- tool list;
- usage limits;
- spending limits;
- execution history;
- approval policy;
- failure behavior;
- audit trail.

---

# 28. Agent safety and cost controls

Agent loops can become a major margin risk.

The product therefore needs hard controls from V1:

```text
tenant_daily_agent_limit
tenant_monthly_ai_budget
agent_run_timeout
max_tool_calls_per_run
max_retries
approval_required_for_sensitive_actions
```

Potential high-risk actions requiring approval:

- sending large outbound campaigns;
- financial actions;
- publishing sensitive legal content;
- changing domains;
- deleting business data;
- modifying billing;
- external purchases.

The default should be:

> **AI can recommend broadly, execute narrowly, and require approval where consequences are material.**

---

# 29. Data architecture

The original line-based multi-tenant PostgreSQL approach should remain.

Core principle:

> **One logical database, tenant isolation by row, enforced by application and database policy.**

Tables should include `tenant_id` wherever business-owned data exists.

Potential core domains:

```text
identity
organizations / tenants
memberships
business
formation
brand
websites
pages
content
social
leads
crm
email
agents
workflows
billing
usage
notifications
documents
audit
analytics
integrations
```

---

# 30. Database rules

## Rule 1

No business query without an explicit tenant context.

## Rule 2

RLS is mandatory for tenant-owned data.

## Rule 3

Sensitive documents live in private storage.

## Rule 4

Secrets and OAuth credentials are encrypted.

## Rule 5

Usage events are append-only.

## Rule 6

Credit ledger is append-only.

## Rule 7

Financially meaningful state transitions are auditable.

## Rule 8

Long-running workflows are state machines, not ad-hoc booleans.

---

# 31. Canonical data entities

Initial entities should include:

```text
tenants
users
memberships
business_profiles
companies
formation_orders
company_documents
signatures
sites
pages
posts
social_accounts
content_items
publish_attempts
lead_lists
leads
opportunities
activities
email_domains
campaigns
sequences
subscriptions
credit_ledger
usage_events
agent_runs
workflows
workflow_runs
notifications
audit_logs
integrations
```

---

# 32. State machines

Stateful business processes should use explicit states.

Example formation:

```text
draft
→ documents_collected
→ review_required
→ kyc_or_identity_check
→ ready_to_submit
→ submitted
→ filed
→ formed
→ ein_pending
→ ein_issued
→ complete
```

The exact state machine must reflect the actual provider and legal workflow.

The principle is what matters:

> **Business state should be explicit and observable.**

---

# 33. Event-driven architecture

ZeroCorp should introduce an internal event model early.

Examples:

```text
TenantCreated
PaymentSucceeded
OnboardingStarted
BusinessProfileCompleted
WebsiteGenerated
WebsitePublished
FormationSubmitted
FormationStatusChanged
DocumentUploaded
DomainConnected
EmailDomainVerified
WarmupMilestoneReached
SocialAccountConnected
ContentGenerated
ContentPublished
LeadDiscovered
LeadQualified
FollowupSent
AgentRunStarted
AgentRunCompleted
CreditConsumed
SubscriptionChanged
NotificationCreated
```

Events should feed Inngest workflows or equivalent durable jobs.

This creates a cleaner separation between:

```text
state
business event
workflow
side effect
notification
```

---

# 34. Modular monolith first

ZeroCorp should start as a **modular monolith**, not a microservice maze.

Recommended structure:

> Refined by [ADR 0001](./adr/0001-runtime-topology.md). The instinct here was right —
> modular monolith, not microservices — but `apps/web` was split in two, because tenant
> websites and the authenticated back-office have opposite traffic profiles, cache
> strategies and blast radii. Business capabilities became modules inside
> `packages/domain` and `packages/application` rather than top-level packages.
> `ARCHITECTURE.md` §3 owns the current layout.

**Initial Deployment / Current Topology**

```text
apps/
  sites/          tenant websites — anonymous, edge-cached, DB read-only
  app/            back-office + admin console — authenticated
  worker/         jobs, workflows, agents
```

**Target Architecture** adds, on trigger:

```text
apps/
  api/            public API — mobile, partners, enterprise. Never an internal BFF.
```

```text
packages/
  contracts/      config/      design-system/         L0
  domain/                                             L1
  application/                                        L2
  db/  tenancy/  auth/  billing/  ai/                 L3
  integrations/  storage/  notifications/  security/
  ui/  site-renderer/                                 L4
```

Business capabilities — formation, brand, website, content, social, leads, crm, email,
agents, workflows, usage, analytics, domains — are modules **inside** `domain/` and
`application/`, not separate packages. `observability/` and `i18n/` still have no home;
tracked in `OPEN_DECISIONS.md`.

Do not split these into networked microservices until scale or team structure clearly requires it.

---

# 35. Integration abstraction

External providers must sit behind internal interfaces.

Examples:

```text
BillingProvider
AIProvider
ImageProvider
SpeechProvider
EmailProvider
SocialPublisher
FormationProvider
DomainProvider
IdentityProvider
StorageProvider
AnalyticsProvider
NotificationProvider
```

The rest of the product should depend on these abstractions, not vendor SDKs everywhere.

This allows ZeroCorp to replace providers without rewriting the domain model.

---

# 36. Security architecture

ZeroCorp will handle highly sensitive business and potentially identity information.

Security priorities:

### Identity documents

- private bucket;
- encryption at rest;
- short-lived signed URLs;
- access logs;
- strict operator permissions;
- deletion policy;
- no sensitive document data in logs.

### Authentication

- secure authentication;
- MFA / 2FA for administrators;
- session management;
- account recovery controls;
- suspicious login detection.

### Secrets

- encrypted OAuth tokens;
- encrypted API credentials;
- separate encryption keys / secrets management;
- rotation procedures.

### Audit

Every sensitive action should be attributable:

```text
who
what
when
tenant
object
result
source
```

---

# 37. Admin console

The admin console is not optional.

It should provide:

- formation queue;
- document review;
- provider references;
- status transitions;
- tenant lookup;
- tenant activity;
- usage monitoring;
- cost monitoring;
- billing review;
- flagged payments;
- impersonation / support mode with full audit trail;
- failed workflows;
- external integration health.

Design principle:

> **Every manual operation in V1 should be easy to delegate later.**

---

# 38. Internationalization strategy

Product language at launch:

> **English**

Product currency at launch:

> **USD**

But the backend must be designed for internationalization from the first commit.

Required concepts:

```text
locale
timezone
currency
numberFormat
dateFormat
```

Do not hard-code assumptions such as:

```text
USD-only data model
English-only strings
US-only dates
single timezone
```

Recommended sequence:

```text
en-US
 ↓
fr-FR
 ↓
es-ES
 ↓
pt-BR / pt-PT
 ↓
other markets based on demand
```

The UI may be English-only initially while the architecture remains multilingual-ready.

---

# 39. Domain and hosting architecture

Custom domains should resolve to a common multi-tenant application.

```text
customer-domain.com
        ↓
Cloudflare for SaaS
        ↓
SSL / hostname resolution
        ↓
Next.js multi-tenant renderer
        ↓
tenant/site lookup
        ↓
Postgres
```

Cloudflare's current platform documentation lists 100 included custom hostnames on Free/Pro/Business plans and $0.10 per additional hostname, with a stated maximum of 50,000 on those plans. Treat current vendor pricing as a launch-time verification item rather than hard-code it into product economics.

---

# 40. Observability and internal economics

Every important feature needs observability.

Track:

- execution time;
- error rate;
- retries;
- tenant;
- feature;
- provider;
- model;
- tokens / units;
- actual cost;
- credits consumed;
- result status.

This is essential for understanding whether a $99, $399 or $799 plan is economically viable.

The product should answer questions such as:

> Which customers are expensive?

> Which feature consumes the most margin?

> Which AI provider is cheapest for this task at acceptable quality?

> Which plan has the best gross margin?

> How much agent usage does an Autopilot customer actually consume?

---

# 41. Product analytics

Track the full customer lifecycle.

## Acquisition

- visitor;
- signup;
- checkout started;
- checkout completed.

## Activation

- onboarding started;
- Business Brain complete;
- domain connected;
- website live;
- first content published;
- first lead found;
- first campaign launched.

## Retention

- weekly active business;
- daily activity;
- features used;
- notifications opened;
- reports viewed;
- agents executed.

## Revenue

- setup revenue;
- MRR;
- ARR;
- ARPA;
- expansion;
- churn;
- failed payments;
- refunds;
- chargebacks.

---

# 42. Retention strategy

The strongest retention mechanism is not “we host your website.”

It is:

> **Your business's operational history and ongoing workflows live here.**

High-retention assets:

- Business Brain;
- website;
- content history;
- prospect lists;
- CRM pipeline;
- outbound sequences;
- analytics history;
- document vault;
- agent memory;
- workflow configuration;
- notification history;
- financial records / invoice history when introduced.

The more useful operating history accumulates, the more ZeroCorp becomes infrastructure rather than a disposable SaaS tool.

---

# 43. The business should feel cumulative

The product should improve as the customer uses it.

Example:

```text
Week 1
Business Brain established

Week 2
Content and audience data improve

Week 4
Lead patterns emerge

Month 2
Agents understand business preferences

Month 3
Automation increases

Month 6
ZeroCorp knows how this business operates
```

The goal is to make accumulated context a product moat.

---

# 44. AI architecture — central principle

AI should be used where it creates leverage, not where it creates novelty.

Three layers:

### Generation

- text;
- images;
- summaries;
- drafts.

### Reasoning / classification

- lead qualification;
- content classification;
- routing;
- prioritization;
- anomaly detection.

### Action

- publish;
- send;
- update CRM;
- notify;
- trigger workflows.

Actions require explicit permissions.

---

# 45. LLM routing strategy

Keep a provider-agnostic abstraction.

```text
Task
 ↓
Task router
 ↓
Model selection
 ↓
Provider
 ↓
Output schema
 ↓
Validation
 ↓
Business action
```

Use cheaper models for:

- classification;
- extraction;
- formatting;
- simple rewrites.

Use stronger models for:

- strategic synthesis;
- high-value research;
- complex agent tasks;
- important business reasoning.

Do not route every operation to the most expensive model.

---

# 46. Human-in-the-loop architecture

The product should not force an all-or-nothing automation philosophy.

Each workflow should support:

```text
Auto
Review
Approve
Reject
Retry
Escalate
```

Especially for:

- legal-ish content;
- financial actions;
- external publishing;
- outbound messaging;
- business identity changes.

---

# 47. V1 scope — what must actually ship

The V1 should be narrower than the ultimate ZeroCorp vision.

## Must ship

1. Landing / acquisition flow
2. Checkout
3. Tenant creation
4. Onboarding
5. Voice onboarding
6. Business Brain
7. Formation tracking
8. Admin console
9. Website renderer
10. Website block editor
11. Domain management
12. Basic email infrastructure state
13. Blog / content engine
14. Notifications
15. Billing
16. Credits / usage
17. Core analytics

## Build the architecture for, but do not necessarily finish in V1

- social publishers;
- CRM;
- prospect enrichment;
- advanced outbound;
- agents;
- accounting;
- professional partner marketplace;
- advanced financial automation.

This preserves the long-term architecture without forcing the first release to become enormous.

---

# 48. Development roadmap

## Phase 0 — System definition

Before implementation:

- product specification;
- information architecture;
- design system;
- design tokens;
- database model;
- domain model;
- API contracts;
- event model;
- component registry;
- provider abstractions;
- security model;
- i18n model.

## Phase 1 — Foundation

- Next.js application;
- auth;
- tenant model;
- DB / RLS;
- design system;
- dashboard shell;
- billing;
- storage;
- observability.

## Phase 2 — Launch experience

- onboarding;
- Business Brain;
- formation workflow;
- documents;
- signature;
- admin console;
- launch checklist.

## Phase 3 — Digital foundation

- website renderer;
- blocks;
- variants;
- editor;
- domain connection;
- blog;
- initial content engine.

## Phase 4 — Growth

- prospects;
- CRM;
- email;
- social;
- analytics;
- content calendar.

## Phase 5 — Autopilot

- agent abstraction;
- agent runtime;
- agent tools;
- Telegram;
- daily reports;
- approval workflows;
- advanced automation.

---

# 49. What must be started immediately because it is external to engineering

The original product analysis correctly identifies external clocks that can delay launch.

These should be treated as a dedicated launch track:

- payment processor review;
- social platform OAuth / app reviews;
- formation-provider relationship;
- email infrastructure / domain warm-up;
- prospect data sourcing;
- compliance review;
- legal review of customer terms and provider responsibilities.

The rule is:

> **Never let engineering progress hide a non-engineering dependency.**

Maintain an “external dependencies” board.

---

# 50. Legal / licensing discipline

Every external package must be recorded with:

```text
package
version
license
source
usage
modifications
review date
```

MIT and Apache-style licenses may often permit the required integration patterns, but every dependency must still be checked at the version actually integrated.

AGPL / source-available / unusual commercial licenses require explicit review before becoming core dependencies.

Never assume that “open source” means “safe to embed in a commercial SaaS.”

---

# 51. Claude Code operating rules

A project-level `CLAUDE.md` should enforce these rules.

## Rule A — Architecture first

Do not create new modules without checking the existing domain architecture.

## Rule B — Design system first

Do not create custom UI when an approved component exists.

## Rule C — No arbitrary visual invention

Do not invent new visual patterns without design-system approval.

## Rule D — Tenant isolation

Every tenant-owned query must carry tenant context.

## Rule E — No direct provider coupling

Use provider abstractions.

## Rule F — Validate AI output

All structured AI output must be schema validated.

## Rule G — Events over spaghetti side effects

Use domain events and durable workflows for asynchronous operations.

## Rule H — Audit sensitive actions

Anything affecting money, identity, security or external communication must be auditable.

## Rule I — Test state transitions

Test workflows and state machines, not only UI components.

## Rule J — Reuse before invent

Search the component library and codebase before adding new code.

---

# 52. Recommended `CLAUDE.md` behavioral rules

The following principles should be encoded directly into the repository:

```text
You are implementing ZeroCorp, not redesigning it from scratch.

Do not invent product architecture when a documented pattern exists.
Do not create a new UI pattern when a canonical component exists.
Do not introduce arbitrary CSS values when design tokens exist.
Do not bypass the tenant context.
Do not call external providers directly from random modules.
Do not allow LLM output to bypass schemas.
Do not allow agents to execute privileged actions without explicit permission.
Do not store secrets in source code.
Do not log sensitive identity data.
Do not create customer-specific code forks.
Do not generate HTML as the source of truth for websites.
Use structured JSON + schema validation + component rendering.
Prefer simple, maintainable code over premature abstraction.
```

---

# 53. Product quality bar

The product should feel:

- premium;
- calm;
- fast;
- trustworthy;
- intelligent;
- operational;
- international;
- cohesive.

It should not feel:

- like a generic AI wrapper;
- like a cheap website builder;
- like a developer admin panel;
- like a dashboard assembled from random templates;
- like an automation marketplace.

---

# 54. Quality principles for visual design

A screen should pass these tests:

### Consistency

Does it use existing components and patterns?

### Hierarchy

Is the primary action obvious?

### Density

Does the information density match the task?

### Feedback

Does the user know what happened after every important action?

### Trust

Does the UI make sensitive actions feel deliberate and safe?

### Motion

Does motion clarify state instead of decorating the interface?

### Responsiveness

Does the design remain coherent across screen sizes?

### Accessibility

Can users navigate, read and operate the interface reliably?

---

# 55. Design-system governance

The design system needs an owner and an approval process.

Any proposed new component should answer:

1. Why can't an existing component solve the problem?
2. Is the pattern likely to recur?
3. Is the interaction genuinely different?
4. Can it be generalized?
5. Does it fit the visual language?
6. Has its responsive behavior been defined?
7. Have states been defined?
8. Has accessibility been defined?

Only then should it become canonical.

---

# 56. Product moat hypothesis

ZeroCorp's moat should not be “we use AI.”

That is not durable.

Potential moat layers are:

### 1. Business Brain

Structured business knowledge accumulated over time.

### 2. Operating history

The product knows what has already been done.

### 3. Workflow graph

The product knows how the customer's business processes run.

### 4. Distribution

SEO, content, partnerships, referrals, affiliates and community.

### 5. Operational infrastructure

Formation, domains, email, content, leads, CRM, automation.

### 6. Trust

A reliable system handling important business workflows.

### 7. Network of partners

Formation providers, legal professionals, accountants and other specialists.

---

# 57. Expansion strategy

Do not launch every adjacent feature immediately.

Use the principle:

> **Expand where retention value and willingness to pay are obvious.**

Potential future modules:

- invoicing;
- financial dashboard;
- accounting integrations;
- legal partner marketplace;
- tax partner network;
- payments;
- advanced sales automation;
- customer support agents;
- proposal generation;
- business intelligence;
- multi-company management;
- agency / white-label mode.

---

# 58. Multi-business future

The architecture should eventually allow one user to own multiple business entities or brands.

Conceptual structure:

```text
User
 ├── Business A
 │     ├── Website
 │     ├── Leads
 │     └── Agents
 ├── Business B
 │     ├── Website
 │     ├── Leads
 │     └── Agents
 └── Business C
```

This could become a major expansion path for serial founders and agencies.

---

# 59. Agency / partner mode

A later product could support:

- multiple tenants under one partner;
- agency branding;
- centralized billing;
- client management;
- shared workflows;
- delegated support.

This may become a separate pricing category with materially higher ARPA.

It should not, however, distort the first consumer-facing product architecture.

---

# 60. Success metrics for the first 12 months

## North-star

**Active businesses operating through ZeroCorp.**

## Revenue

- MRR;
- ARR;
- ARPA;
- setup revenue;
- expansion revenue.

## Activation

- % reaching website live;
- % completing Business Brain;
- time to first value;
- time to launch.

## Retention

- 30-day retention;
- 90-day retention;
- logo churn;
- revenue churn;
- net revenue retention.

## Product usage

- weekly active businesses;
- published content;
- leads discovered;
- campaigns launched;
- agents run;
- workflows executed.

## Economics

- gross margin;
- AI cost per customer;
- support cost per customer;
- formation servicing cost;
- payback period.

---

# 61. First-value metric

A critical metric should be:

> **Time from payment to “My business is visibly alive.”**

This is better than measuring how long it takes to fill out onboarding.

Potential definition:

```text
Payment
 ↓
Business Brain approved
 ↓
Website live
 ↓
First useful output
```

The shorter this becomes, the stronger the product feels.

---

# 62. Pricing validation strategy

Do not debate pricing forever before having usage data.

Run structured tests.

Example:

```text
Early cohort:
$997 + $99

Growth cohort:
$997 + $299/$399

Autopilot cohort:
$997 + $799
```

Measure:

- checkout conversion;
- activation;
- churn;
- feature adoption;
- willingness to upgrade;
- gross margin;
- support load.

Pricing should be adjusted based on demonstrated value.

---

# 63. Unit economics rule

Every feature must answer:

```text
Does it increase conversion?
Does it increase ARPA?
Does it increase retention?
Does it reduce cost-to-serve?
Does it reduce support burden?
Does it create a moat?
```

Features that answer none of these questions should be deprioritized.

---

# 64. Critical business risks

## Risk 1 — Low perceived value

Mitigation:

Show tangible outputs quickly.

## Risk 2 — Too much product too early

Mitigation:

Ship the launch layer first.

## Risk 3 — Poor AI quality

Mitigation:

Business Brain + schemas + evaluations + human approvals.

## Risk 4 — High AI costs

Mitigation:

Usage meters + routing + budgets + limits.

## Risk 5 — External provider delays

Mitigation:

Start external processes immediately.

## Risk 6 — Security incident

Mitigation:

Strict tenant isolation, private documents, audit logs, MFA, least privilege.

## Risk 7 — SEO content becomes low quality

Mitigation:

Quality gating, topical authority, original evidence, editorial controls and selective publication.

## Risk 8 — Overdependence on one third-party provider

Mitigation:

Provider abstraction.

---

# 65. What should NOT be optimized prematurely

Do not spend large amounts of engineering time on:

- microservices;
- custom infrastructure that managed services can provide;
- custom LLM hosting;
- a giant CRM;
- dozens of social platforms;
- dozens of website blocks before the first customers;
- autonomous agents that do everything;
- perfect automation of formation workflows before volume exists.

The product should optimize for:

> **fast learning + real customer value + maintainable architecture.**

---

# 66. What should be over-engineered early

Some areas deserve disproportionate care because failure there is expensive:

- tenant isolation;
- authentication;
- billing;
- usage accounting;
- sensitive document storage;
- design system;
- component registry;
- Business Brain;
- state machines;
- audit logs;
- provider abstraction;
- event architecture.

---

# 67. The central product loop

The entire product can be reduced to one loop:

```text
Understand the business
        ↓
Build the business
        ↓
Operate the business
        ↓
Observe the business
        ↓
Learn from the business
        ↓
Improve the business
        ↓
Automate more
        ↺
```

This should be the conceptual backbone of ZeroCorp.

---

# 68. The central UX loop

The user-facing loop is:

```text
Tell ZeroCorp what you need
        ↓
ZeroCorp shows progress
        ↓
ZeroCorp does the work
        ↓
User sees tangible result
        ↓
User receives notification
        ↓
User approves when needed
        ↓
ZeroCorp continues
```

This is much more powerful than a conventional SaaS pattern of:

> click button → fill form → wait.

---

# 69. The central technical loop

The technical loop is:

```text
Structured business data
        ↓
Domain logic
        ↓
Events
        ↓
Durable workflows
        ↓
Provider abstractions
        ↓
External action
        ↓
Persisted result
        ↓
Notification
        ↓
Analytics / usage
```

This should be the default mental model for engineering decisions.

---

# 70. The central Claude Code loop

Claude Code should work like this:

```text
Read specification
      ↓
Find canonical pattern
      ↓
Implement
      ↓
Run type checks
      ↓
Run tests
      ↓
Run lint / static analysis
      ↓
Review against design system
      ↓
Review tenant isolation
      ↓
Review error states
      ↓
Commit small coherent change
```

Claude Code should not be given freedom to redefine architecture mid-implementation.

---

# 71. Launch checklist

Before public launch:

## Product

- onboarding works;
- Business Brain produces reliable structured output;
- website can be generated;
- domain can be connected;
- blog can publish;
- notifications work;
- billing works;
- usage tracking works.

## Security

- RLS verified;
- private documents verified;
- admin MFA verified;
- secrets encrypted;
- logs sanitized;
- audit trail verified.

## Business

- formation provider ready;
- payment processing reviewed;
- terms prepared;
- privacy documents prepared;
- refund policy defined;
- support process defined.

## Design

- design tokens locked;
- component library locked;
- responsive rules tested;
- loading states tested;
- error states tested;
- empty states tested;
- accessibility review completed.

---

# 72. Launch-day customer journey

The ideal experience:

```text
LANDING PAGE
   ↓
"Tell us about your business"
   ↓
Checkout
   ↓
$997
   ↓
Business onboarding
   ↓
Voice conversation
   ↓
Business Brain generated
   ↓
Customer approves
   ↓
Formation starts
   ↓
Website generation starts
   ↓
Website goes live
   ↓
Domain setup
   ↓
Email setup
   ↓
Content engine starts
   ↓
Daily notifications begin
   ↓
Growth features become available
   ↓
Automation / agents become available
```

The user should feel momentum throughout the journey.

---

# 73. Strategic conclusion

The central ZeroCorp idea is not:

> “AI builds websites.”

The central idea is:

> **A founder describes a business once, and ZeroCorp builds the operational foundation, keeps it running, and progressively automates it.**

That positioning creates room for:

- formation;
- digital infrastructure;
- content;
- marketing;
- sales;
- CRM;
- finance;
- compliance workflows;
- agents;
- automation.

It also provides a logical reason for recurring revenue.

The customer is not paying forever for a website.

The customer is paying for an increasingly valuable business operating layer.

---

# 74. Final product principles

These principles should survive product changes, framework changes and AI model changes.

## Principle 1

**Build the business, not just the website.**

## Principle 2

**Business data is the source of truth.**

## Principle 3

**The Business Brain powers every downstream system.**

## Principle 4

**Sites are data, not code.**

## Principle 5

**AI composes approved systems; it does not invent the design system.**

## Principle 6

**Every important action must be observable.**

## Principle 7

**Every external provider must be replaceable.**

## Principle 8

**Every tenant must be isolated by design.**

## Principle 9

**Automation should create visible value.**

## Principle 10

**The product should feel more valuable the longer the customer uses it.**

## Principle 11

**Ship a narrow V1 while preserving a broad architecture.**

## Principle 12

**Optimize for ARPA, retention and gross margin, not vanity user counts.**

## Principle 13

**English-first and USD-first at launch; international by architecture.**

## Principle 14

**Content scale must never become a substitute for content quality.**

## Principle 15

**Claude Code implements the system; it does not redefine the system.**

---

# 75. Immediate next documents to create

This master document should be followed by these repository documents:

```text
/docs/PRODUCT_VISION.md
/docs/PRODUCT_SPEC.md
/docs/DESIGN_SYSTEM.md
/docs/ARCHITECTURE.md
/docs/DATABASE.md
/docs/EVENTS.md
/docs/API_CONTRACTS.md
/docs/SECURITY.md
/docs/AI_ARCHITECTURE.md
/docs/AGENTS.md
/docs/BILLING_AND_USAGE.md
/docs/I18N.md
/docs/CONTENT_ENGINE.md
/docs/CLAUDE_CODE_RULES.md
/docs/LICENSING.md
```

The most important documents to lock before broad implementation are:

1. **DESIGN_SYSTEM.md**
2. **ARCHITECTURE.md**
3. **DATABASE.md**
4. **PRODUCT_SPEC.md**
5. **CLAUDE_CODE_RULES.md**

---

# 76. External verification notes — August 2026

This section records facts that should be treated as external dependencies rather than permanent assumptions.

### Cloudflare

Current Cloudflare for SaaS documentation lists 100 included custom hostnames on Free/Pro/Business plans and $0.10 per additional hostname, with up to 50,000 hostnames on those plans. Re-check commercial terms at launch.

### Stripe

Stripe currently supports global payments, subscriptions, usage-related billing capabilities and fraud tooling. Exact fees vary by market, payment method and product. Do not bake vendor pricing into product pricing without a current margin model.

### Google Search

Google's current guidance emphasizes people-first, useful, reliable content and identifies scaled content abuse as a spam category when many pages are created primarily to manipulate Search rather than help users. Therefore ZeroCorp's high-volume content engine must optimize for quality and usefulness rather than simply publishing a fixed number of AI-generated pages.

### Legal / tax

Formation, legal and tax obligations must be validated against the actual jurisdictions, providers and customer profiles served. Product copy must not imply professional legal or tax advice where it is not being provided by qualified professionals.

---

# 77. Final north-star sentence

> **ZeroCorp lets a founder describe a business once, then turns that description into a real business foundation and an increasingly automated digital operation.**

That is the product to build.
