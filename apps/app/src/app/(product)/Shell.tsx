"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArticleIcon,
  BellIcon,
  BuildingsIcon,
  BrowserIcon,
  ChartBarIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  LifebuoyIcon,
  PaletteIcon,
  SparkleIcon,
  SignOutIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, IconButton, type NavGroup } from "@zerocorp/ui";
import { signOut } from "./actions";

/**
 * The product's frame.
 *
 * The groups are the journey PRODUCT_SPEC.md §29.3 describes — Build, Launch, Grow —
 * not a filing system. A founder reading this rail should be able to see what ZeroCorp
 * does for them, in the order it does it, without opening anything.
 */
const GROUPS: NavGroup[] = [
  {
    label: "Build",
    items: [
      { label: "Overview", href: "/dashboard", icon: ChartBarIcon },
      // Renamed from "Launch your business", which collided with the dashboard's plan
      // list. The plan is what ZeroCorp is BUILDING; this is what it needs to KNOW.
      { label: "Tell us about your business", href: "/onboarding", icon: SparkleIcon },
      { label: "Company", href: "/company", icon: BuildingsIcon },
      { label: "Brand", href: "/brand", icon: PaletteIcon },
    ],
  },
  {
    label: "Launch",
    items: [
      { label: "Website", href: "/website", icon: BrowserIcon },
      { label: "Email", href: "/email", icon: EnvelopeSimpleIcon },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "Content", href: "/content", icon: ArticleIcon },
      { label: "Customers", href: "/leads", icon: UsersThreeIcon },
    ],
  },
];

const FOOTER = [
  { label: "Settings", href: "/settings", icon: GearIcon },
  { label: "Help", href: "/help", icon: LifebuoyIcon },
];

export function Shell({
  businessName,
  email,
  needsYou,
  counts,
  children,
}: {
  businessName: string;
  email: string;
  needsYou: number;
  /** How much of each thing exists. Keyed by href so the nav stays the single list. */
  counts: Record<string, number>;
  children: ReactNode;
}) {
  const pathname = usePathname();

  /*
    Counts in the navigation.

    DashboardShell has supported a badge per entry since it was written and nothing ever
    passed one, so a tenant with twenty articles and fifteen leads had a sidebar
    indistinguishable from an empty account. The count is the cheapest possible signal
    that the product is doing something.
  */
  /*
    Counts, sub-sections and attention.

    ONE treatment for every count: the first version gave two of them the yellow accent
    and left the rest grey, which reads as a job left half done. Attention is now the
    ROW's business — a pulsing dot — and the count keeps one appearance everywhere.

    The sub-sections mirror each screen's own tabs, so the sidebar describes the whole
    product rather than only its seven front doors.
  */
  const SUB: Record<string, { label: string; href: string; count?: number }[]> = {
    "/company": [
      { label: "Entity", href: "/company#entity" },
      { label: "Filing", href: "/company#filing", count: counts["/company"] ?? 0 },
      { label: "Registrations", href: "/company#registrations" },
      { label: "Documents", href: "/company#documents" },
    ],
    "/website": [
      { label: "Pages", href: "/website#pages", count: counts["/website"] ?? 0 },
      { label: "Domain", href: "/website#domain" },
    ],
    "/email": [
      { label: "Authentication", href: "/email#auth" },
      { label: "Warm-up", href: "/email#warmup" },
      { label: "Mailboxes", href: "/email#mailboxes", count: counts["/email"] ?? 0 },
    ],
    "/content": [
      { label: "Keywords", href: "/content#keywords" },
      { label: "Calendar", href: "/content#calendar" },
      { label: "Articles", href: "/content#articles", count: counts["/content"] ?? 0 },
    ],
    "/leads": [
      { label: "Overview", href: "/leads#overview" },
      { label: "Lists", href: "/leads#lists" },
      { label: "Prospects", href: "/leads#leads", count: counts["/leads"] ?? 0 },
    ],
  };

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const children = SUB[item.href];
      const base = children ? { ...item, children } : item;

      if (item.href === "/dashboard") {
        return needsYou > 0 ? { ...base, badge: needsYou, attention: true } : base;
      }
      // Company badges only when something is actually waiting, so the number there is
      // an open question rather than a count of companies.
      if (item.href === "/company") {
        const open = counts["/company"] ?? 0;
        return open > 0 ? { ...base, badge: open, attention: true } : base;
      }
      const n = counts[item.href] ?? 0;
      return n > 0 ? { ...base, badge: n } : base;
    }),
  }));

  return (
    <DashboardShell
      groups={groups}
      footerNav={FOOTER}
      activePath={pathname}
      linkAs={Link}
      account={
        <div className="flex items-center gap-3 px-2 py-1">
          <span className="bg-primary text-primary-foreground text-caption flex size-7 shrink-0 items-center justify-center font-medium">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="text-caption text-muted-foreground min-w-0 flex-1 truncate">{email}</span>
          <form action={signOut}>
            <IconButton icon={SignOutIcon} label="Sign out" variant="ghost" size="sm" type="submit" />
          </form>
        </div>
      }
      topBar={
        <>
          <span className="text-body-sm truncate font-medium">{businessName}</span>
          <div className="ml-auto flex items-center gap-1">
            <IconButton icon={BellIcon} label="Notifications" variant="ghost" />
          </div>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
