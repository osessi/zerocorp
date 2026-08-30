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

**$997 one-time Business Launch Setup**

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

Lead system progression:

### V1

- curated lead lists;
- filtering;
- CSV export.

### Later

- lead enrichment;
- campaigns;
- CRM;
- pipeline;
- automated follow-up.

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

Channels:

- in-app;
- email;
- Telegram;
- desktop/browser notification where supported.

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

Internal lifecycle:

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

