import {
  ArticleIcon,
  BrowserIcon,
  BuildingsIcon,
  ChartLineIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  PaletteIcon,
  QuestionIcon,
  SquaresFourIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { PhosphorIcon } from "./Icon";

/**
 * The ZeroCorp Icon Dictionary. docs/DESIGN_SYSTEM.md §11b.
 *
 * A typed manifest mapping PRODUCT CONCEPTS to canonical glyphs. Rebuilt from the
 * pattern in Twenty (twenty-ui, MIT) — the idea of a dictionary with "use when" and
 * "avoid when", not their icons or their code.
 *
 * This is the second half of the enforcement mechanism. `Icon` makes an off-scale SIZE a
 * compile error; the dictionary makes an off-vocabulary CHOICE a review-able fact,
 * because every concept has exactly one glyph and the reasoning sits beside it.
 *
 * The rule the 2026-09-04 audit produced:
 *
 *   > A standard nothing enforces is not locked, it is decorative.
 *
 * A dictionary nobody consults is the same thing, so: import icons from here, not from
 * `@phosphor-icons/react`. A lint rule enforces it.
 */

export interface DictionaryEntry {
  /** The glyph, regular weight. */
  readonly icon: PhosphorIcon;
  /**
   * Whether this concept has an active state in the rail.
   *
   * Phosphor v2 ships ONE component per glyph with a `weight` prop, not a separate
   * filled component, so the "filled counterpart" is `weight="fill"` on the same icon.
   * That is better than Twenty's arrangement: the two weights are guaranteed to be the
   * same drawing, so a cross-fade between them cannot jump.
   */
  readonly navigable?: boolean;
  /** The Phosphor name, so the choice can be checked against their catalogue. */
  readonly phosphor: string;
  readonly useWhen: string;
  readonly avoidWhen: string;
  readonly keywords: readonly string[];
}

/**
 * The nine areas of the journey, plus the four furniture concepts.
 *
 * Every one of these is a PLACE in the product, which is why each has a filled
 * counterpart: they appear in the rail, and the rail's active state is a weight change.
 */
export const ICONS = {
  overview: {
    icon: SquaresFourIcon,
    navigable: true,
    phosphor: "squares-four",
    useWhen: "The command centre. What ZeroCorp is doing for you, across every area.",
    avoidWhen: "Representing a grid layout, a dashboard widget, or an apps directory.",
    keywords: ["overview", "command centre", "home", "dashboard"],
  },
  company: {
    icon: BuildingsIcon,
    navigable: true,
    phosphor: "buildings",
    useWhen: "The founder's own legal entity: formation, filings, EIN, registered agent.",
    avoidWhen: "A prospect company on the Customers screen. That is a record, use avatar initials.",
    keywords: ["company", "entity", "formation", "incorporation", "filing"],
  },
  brand: {
    icon: PaletteIcon,
    navigable: true,
    phosphor: "palette",
    useWhen: "Name, positioning, colours, voice. The identity ZeroCorp generated or the founder chose.",
    avoidWhen: "A theme picker for the ZeroCorp interface itself. That is Settings.",
    keywords: ["brand", "identity", "positioning", "colours", "name"],
  },
  website: {
    icon: BrowserIcon,
    navigable: true,
    phosphor: "browser",
    useWhen: "The generated customer site: pages, blocks, publishing.",
    avoidWhen: "An external link, or a preview that opens in a new tab. Use an arrow for those.",
    keywords: ["website", "site", "pages", "publish"],
  },
  domain: {
    icon: GlobeHemisphereWestIcon,
    navigable: true,
    phosphor: "globe-hemisphere-west",
    useWhen: "A domain name, DNS, or the fact that something is reachable on the internet.",
    avoidWhen: "Internationalisation or locale. Those are not shipped and would collide.",
    keywords: ["domain", "dns", "hostname", "live"],
  },
  email: {
    icon: EnvelopeSimpleIcon,
    navigable: true,
    phosphor: "envelope-simple",
    useWhen: "The founder's business mailbox: setup, DNS records, deliverability.",
    avoidWhen: "An outbound message to a prospect. V1 does not send those, deliberately.",
    keywords: ["email", "mailbox", "dns", "deliverability"],
  },
  content: {
    icon: ArticleIcon,
    navigable: true,
    phosphor: "article",
    useWhen: "Articles, the editorial calendar, anything ZeroCorp writes and publishes.",
    avoidWhen: "A single note or comment on a record.",
    keywords: ["content", "article", "post", "editorial", "blog"],
  },
  seo: {
    icon: MagnifyingGlassIcon,
    phosphor: "magnifying-glass",
    useWhen: "Keywords, ranking, discoverability. The SEO sub-section of Content.",
    avoidWhen: "A search INPUT. A search field uses the same glyph but is furniture, not this concept.",
    keywords: ["seo", "keywords", "ranking", "search"],
  },
  leads: {
    icon: UsersThreeIcon,
    navigable: true,
    phosphor: "users-three",
    useWhen: "Prospects and lists. The Customers screen.",
    avoidWhen: "Team members on the account. That is Settings, and it is a different noun.",
    keywords: ["leads", "prospects", "customers", "lists"],
  },
  insights: {
    icon: ChartLineIcon,
    navigable: true,
    phosphor: "chart-line",
    useWhen: "Measured outcomes over time. Any screen whose subject is a trend.",
    avoidWhen: "A single figure. A KPI needs no icon; the number is the thing.",
    keywords: ["insights", "analytics", "trend", "reporting"],
  },
  operations: {
    icon: GearIcon,
    navigable: true,
    phosphor: "gear",
    useWhen: "Account settings, plan, people, integrations.",
    avoidWhen: "A per-row action menu. That is a dots glyph, not a gear.",
    keywords: ["settings", "operations", "account", "plan"],
  },
  help: {
    icon: QuestionIcon,
    navigable: true,
    phosphor: "question",
    useWhen: "Documentation and support.",
    avoidWhen: "An inline explanation of one field. That is a tooltip and needs no icon.",
    keywords: ["help", "support", "docs"],
  },
} as const satisfies Record<string, DictionaryEntry>;

export type IconConcept = keyof typeof ICONS;

/** The category keys the plan uses, mapped to concepts. One place, not five. */
export const CATEGORY_ICON: Record<string, IconConcept> = {
  company: "company",
  brand: "brand",
  website: "website",
  domain: "domain",
  email: "email",
  content: "content",
  seo: "seo",
  leads: "leads",
  operations: "operations",
};
