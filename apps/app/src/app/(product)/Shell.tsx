"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArticleIcon,
  BuildingsIcon,
  BrowserIcon,
  ChartBarIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  LifebuoyIcon,
  PaletteIcon,
  SignOutIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { DashboardShell, IconButton, type NavItem } from "@zerocorp/ui";
import { signOut } from "./actions";

/**
 * The product's frame.
 *
 * The navigation IS the V1 delivery blocks, in the order PRODUCT_SPEC.md §29.3 puts
 * them. That is not decoration: a founder reading this sidebar should be able to see
 * what ZeroCorp does for them without opening anything.
 */
const NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: ChartBarIcon },
  { label: "Company", href: "/company", icon: BuildingsIcon },
  { label: "Brand", href: "/brand", icon: PaletteIcon },
  { label: "Website", href: "/website", icon: BrowserIcon },
  { label: "Email", href: "/email", icon: EnvelopeSimpleIcon },
  { label: "Content", href: "/content", icon: ArticleIcon },
  { label: "Customers", href: "/leads", icon: UsersThreeIcon },
];

const FOOTER: NavItem[] = [
  { label: "Settings", href: "/settings", icon: GearIcon },
  { label: "Help", href: "/help", icon: LifebuoyIcon },
];

export function Shell({ businessName, children }: { businessName: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardShell
      nav={NAV}
      footerNav={FOOTER}
      activePath={pathname}
      linkAs={Link}
      topBar={
        <>
          <span className="text-body-sm truncate">{businessName}</span>
          <form action={signOut} className="ml-auto">
            <IconButton icon={SignOutIcon} label="Sign out" variant="ghost" type="submit" />
          </form>
        </>
      }
    >
      {children}
    </DashboardShell>
  );
}
