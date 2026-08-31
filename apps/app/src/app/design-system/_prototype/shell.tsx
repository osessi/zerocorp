"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChartBarIcon, BuildingsIcon, FileTextIcon, PlugsConnectedIcon, ListChecksIcon,
  GearIcon, LifebuoyIcon, MagnifyingGlassIcon, LightningIcon, UserPlusIcon,
  BellIcon, CaretDownIcon, CaretUpIcon, CaretLeftIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cx, Avatar } from "./primitives";

/**
 * DashboardShell · SidebarNavigation · TopCommandBar — DESIGN_SYSTEM.md §21.2–21.4.
 *
 * The sidebar is fixed and carries its own logo header. The top bar spans the CONTENT
 * COLUMN ONLY — it does not cross the sidebar. A single 1px rule separates them; no
 * shadow, no elevation change.
 */

const NAV = [
  { href: "/design-system/screens/overview", label: "Overview", icon: ChartBarIcon },
  {
    label: "Businesses",
    icon: BuildingsIcon,
    children: [
      { href: "/design-system/screens/businesses", label: "All businesses" },
      { href: "/design-system/screens/business", label: "Formation queue" },
    ],
  },
  {
    label: "Documents",
    icon: FileTextIcon,
    children: [{ href: "/design-system/screens/documents", label: "Document vault" }],
  },
  { href: "/design-system/screens/drawer", label: "Integrations", icon: PlugsConnectedIcon },
  { href: "/design-system/screens/tasks", label: "Tasks", icon: ListChecksIcon },
];

function SidebarNavigation({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string[]>(["Businesses", "Documents"]);

  return (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className={cx("flex h-16 items-center", collapsed ? "justify-center px-3" : "px-6")}>
        <span className="text-h4 tracking-tight">{collapsed ? "Z" : "ZeroCorp"}</span>
      </div>

      <ul className="flex flex-1 flex-col gap-0.5 px-3 pt-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isOpen = open.includes(item.label);
          const childActive = item.children?.some((c) => c.href === pathname);

          if (!item.children) {
            const active = item.href === pathname;
            return (
              <li key={item.label}>
                <Link
                  href={item.href!}
                  className={cx(
                    "text-label flex h-9 items-center gap-3 px-3 transition-colors duration-normal ease-out",
                    "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                    active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon size={20} weight="regular" className="shrink-0" />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== item.label) : [...o, item.label]))}
                className={cx(
                  "text-label flex h-9 w-full items-center gap-3 px-3 transition-colors duration-normal ease-out",
                  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                  childActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                aria-expanded={isOpen}
              >
                <Icon size={20} weight="regular" className="shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}
                  </>
                )}
              </button>

              {isOpen && !collapsed ? (
                <ul className="flex flex-col gap-0.5 pt-0.5">
                  {item.children.map((c) => {
                    const active = c.href === pathname;
                    return (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          className={cx(
                            "text-label flex h-9 items-center pl-12 transition-colors duration-normal ease-out",
                            "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                            active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Bottom zone, pinned, separated by a rule — §21.3 */}
      <div className="border-border mx-3 border-t py-3">
        <Link
          href="/design-system"
          className={cx(
            "text-label text-muted-foreground hover:text-foreground flex h-9 items-center gap-3 px-3",
            "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
            collapsed && "justify-center px-0",
          )}
        >
          <GearIcon size={20} />
          {!collapsed && "Components"}
        </Link>
        <span
          className={cx(
            "text-label text-muted-foreground flex h-9 items-center gap-3 px-3",
            collapsed && "justify-center px-0",
          )}
        >
          <LifebuoyIcon size={20} />
          {!collapsed && (
            <>
              <span className="flex-1">Help &amp; Support</span>
              {/* Badge colour is TO VALIDATE (§24 item 9) — neutral until decided. */}
              <span className="bg-muted text-muted-foreground text-caption inline-flex size-5 items-center justify-center">
                3
              </span>
            </>
          )}
        </span>
      </div>
    </nav>
  );
}

function TopCommandBar() {
  return (
    <header className="border-border flex h-16 shrink-0 items-center gap-4 border-b px-6">
      {/* Command palette, not a filter — the placeholder names both behaviours. */}
      <label className="border-input hover:border-input-hover focus-within:outline-ring flex h-9 w-full max-w-md items-center gap-2 border px-3 transition-colors duration-normal ease-out focus-within:outline-2 focus-within:outline-offset-2">
        <MagnifyingGlassIcon size={16} className="text-muted-foreground shrink-0" />
        <input
          className="text-body-sm placeholder:text-muted-foreground w-full bg-transparent focus:outline-hidden"
          placeholder="Search or type a command"
          aria-label="Search or type a command"
        />
      </label>

      <div className="ml-auto flex items-center gap-1">
        <button className="hover:bg-accent focus-visible:outline-ring relative flex size-9 items-center justify-center transition-colors duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2" aria-label="Quick actions">
          <LightningIcon size={20} />
          {/* A dot is a state indicator, never a count — §21.4 */}
          <span className="bg-primary absolute top-2 right-2 size-1.5" aria-hidden="true" />
        </button>
        <button className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-colors duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2" aria-label="Add business">
          <UserPlusIcon size={20} />
        </button>
        <button className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-colors duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2" aria-label="Notifications">
          <BellIcon size={20} />
        </button>
        <span className="bg-border mx-2 h-6 w-px" aria-hidden="true" />
        <button className="hover:bg-accent focus-visible:outline-ring flex items-center gap-2 py-1 pr-2 pl-1 transition-colors duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2" aria-label="Account">
          <Avatar initials="OK" size="sm" />
          <CaretDownIcon size={14} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

export function DashboardShell({ children, dark, onToggleTheme }: { children: ReactNode; dark: boolean; onToggleTheme: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  // §13 — the theme class goes on the root element. A portal escapes any wrapper.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden">
      <aside
        className={cx(
          "border-border relative hidden shrink-0 border-r transition-[width] duration-emphasis ease-out lg:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarNavigation collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="border-border bg-background hover:border-input-hover focus-visible:outline-ring absolute top-20 -right-3 flex size-6 items-center justify-center border transition-colors duration-normal focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <CaretLeftIcon size={12} className={cx("transition-transform duration-emphasis", collapsed && "rotate-180")} />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopCommandBar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Review-only affordance. Not part of the pattern. */}
      <button
        onClick={onToggleTheme}
        className="border-input bg-background text-label focus-visible:outline-ring fixed right-6 bottom-6 z-40 h-9 border px-3 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {dark ? "Light" : "Dark"}
      </button>
    </div>
  );
}

/* ── PageHeader (§21.5) ───────────────────────────────────────────────────── */
export function PageHeader({
  breadcrumb,
  meta,
  title,
  subtitle,
  avatar,
  people,
  actions,
}: {
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  people?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-border border-b">
      {breadcrumb || meta ? (
        <div className="border-border flex items-center justify-between gap-4 border-b px-8 py-3">
          <div className="text-body-sm text-muted-foreground flex min-w-0 items-center gap-2">{breadcrumb}</div>
          {meta ? <div className="text-body-sm text-muted-foreground shrink-0">{meta}</div> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-6">
        <div className="flex min-w-0 items-center gap-4">
          {avatar}
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-h2 truncate">{title}</h1>
            {subtitle ? <div className="text-body-sm text-muted-foreground">{subtitle}</div> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {people}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
