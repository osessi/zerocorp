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
      // First in the journey, because nothing else generates well until it is done.
      { label: "Launch your business", href: "/onboarding", icon: SparkleIcon },
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
  children,
}: {
  businessName: string;
  email: string;
  needsYou: number;
  children: ReactNode;
}) {
  const pathname = usePathname();

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.href === "/dashboard" && needsYou > 0 ? { ...item, badge: needsYou } : item,
    ),
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
