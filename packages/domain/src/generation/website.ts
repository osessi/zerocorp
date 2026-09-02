import type { GeneratedBrand } from "./brand";

/**
 * Pages, as validated block JSON.
 *
 * The renderer takes DATA, never generated markup. A ZeroCorp invariant and
 * CLAUDE_CODE_RULES.md §16: an LLM composes the approved block vocabulary and never
 * emits HTML, React or CSS. This generator holds the same rule, which is why it returns
 * a typed structure rather than a string.
 */

export const BLOCK_TYPES = ["hero", "value_props", "proof", "process", "cta", "faq"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface Block {
  readonly type: BlockType;
  readonly variant: string;
  readonly version: number;
  readonly props: Record<string, unknown>;
}

export interface GeneratedPage {
  readonly slug: string;
  readonly title: string;
  readonly type: "home" | "page" | "contact";
  readonly blocks: readonly Block[];
}

export function generatePages(brand: GeneratedBrand, description: string): GeneratedPage[] {
  const headline = brand.valueProposition.split("—")[0]?.trim() ?? brand.name;

  return [
    {
      slug: "home",
      title: brand.name,
      type: "home",
      blocks: [
        {
          type: "hero", variant: "split", version: 1,
          props: { headline, subhead: brand.positioning, primaryAction: "Start a conversation" },
        },
        {
          type: "value_props", variant: "three_up", version: 1,
          props: {
            items: [
              { title: "What we do", body: description },
              { title: "Who it is for", body: brand.icp },
              { title: "How we work", body: brand.toneOfVoice },
            ],
          },
        },
        { type: "process", variant: "numbered", version: 1, props: { steps: ["Talk", "Plan", "Build", "Hand over"] } },
        { type: "cta", variant: "band", version: 1, props: { headline: "Tell us what you are building", action: "Get in touch" } },
      ],
    },
    {
      slug: "about",
      title: "About",
      type: "page",
      blocks: [
        { type: "hero", variant: "centered", version: 1, props: { headline: "About", subhead: brand.positioning } },
        { type: "proof", variant: "quiet", version: 1, props: { body: description } },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      type: "contact",
      blocks: [
        { type: "hero", variant: "centered", version: 1, props: { headline: "Get in touch", subhead: "" } },
        { type: "cta", variant: "form", version: 1, props: { fields: ["name", "email", "message"] } },
      ],
    },
  ];
}
