"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  SignOutIcon,
  SparkleIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  CommandMenu,
  cx,
  ICONS,
  IconButton,
  Rail,
  type CommandItem,
  type RailGroup,
} from "@zerocorp/ui";
import { signOut } from "./actions";

/**
 * The product's frame.
 *
 * The groups are the journey PRODUCT_SPEC.md §29.3 describes — Build, Launch, Grow —
 * not a filing system. A founder reading this rail should be able to see what ZeroCorp
 * does for them, in the order it does it, without opening anything.
 *
 * ---------------------------------------------------------------------------
 * 2026-09-04: the rail is 72px at rest and 240px on hover.
 *
 * 240px held open on every screen spent 168px on labels that are legible from their
 * icons after the second session. Every screen in the product is now 168px wider, which
 * is what lets a table breathe and what makes a full-bleed composition possible at all.
 *
 * The journey tints survive and improve: collapsed, the tint moves from the group's
 * ground to the icon, which is the same claim made smaller. It still marks a STAGE and
 * never an object, so §4.10 holds.
 *
 * Icons now come from the dictionary rather than from a Phosphor import per screen.
 * §11b: the concept names the glyph, and one place decides which glyph a concept gets.
 * ---------------------------------------------------------------------------
 */
const GROUPS: readonly RailGroup[] = [
  {
    label: "Build",
    tone: "build",
    items: [
      { label: "Overview", href: "/dashboard", icon: ICONS.overview.icon },
      /*
        "Your business", not "Tell us about your business". The rail gives a label about
        127px expanded, and every other entry is one word. It was already renamed once
        from "Launch your business", which collided with the dashboard's plan list. That
        distinction survives: the plan is what ZeroCorp is BUILDING, this is what it
        needs to KNOW.
      */
      { label: "Your business", href: "/onboarding", icon: SparkleIcon },
      { label: "Company", href: "/company", icon: ICONS.company.icon },
      { label: "Brand", href: "/brand", icon: ICONS.brand.icon },
    ],
  },
  {
    label: "Launch",
    tone: "launch",
    items: [
      { label: "Website", href: "/website", icon: ICONS.website.icon },
      { label: "Email", href: "/email", icon: ICONS.email.icon },
    ],
  },
  {
    label: "Grow",
    tone: "grow",
    items: [
      { label: "Content", href: "/content", icon: ICONS.content.icon },
      { label: "Customers", href: "/leads", icon: ICONS.leads.icon },
    ],
  },
];

const FOOTER = [
  { label: "Settings", href: "/settings", icon: ICONS.operations.icon },
  { label: "Help", href: "/help", icon: LifebuoyIcon },
];

/** Sub-sections mirror each screen's own tabs, so the rail describes the whole product. */
const SUB: Record<string, { label: string; href: string }[]> = {
  "/company": [
    { label: "Entity", href: "/company#entity" },
    { label: "Filing", href: "/company#filing" },
    { label: "Registrations", href: "/company#registrations" },
    { label: "Documents", href: "/company#documents" },
  ],
  "/website": [
    { label: "Pages", href: "/website#pages" },
    { label: "Domain", href: "/website#domain" },
  ],
  "/email": [
    { label: "Authentication", href: "/email#auth" },
    { label: "Warm-up", href: "/email#warmup" },
    { label: "Mailboxes", href: "/email#mailboxes" },
  ],
  "/content": [
    { label: "Keywords", href: "/content#keywords" },
    { label: "Calendar", href: "/content#calendar" },
    { label: "Articles", href: "/content#articles" },
  ],
  "/leads": [
    { label: "Overview", href: "/leads#overview" },
    { label: "Lists", href: "/leads#lists" },
    { label: "Prospects", href: "/leads#leads" },
  ],
};

export function Shell({
  email,
  needsYou,
  counts,
  attention,
  announcement,
  children,
}: {
  email: string;
  needsYou: number;
  counts: Record<string, number>;
  attention: Record<string, boolean>;
  announcement?: { message: string; href: string; action: string } | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  /*
    The rail's PINNED state, lifted here because the content column has to reserve the
    width. In peek mode the rail floats over the content and nothing reflows; pinned, it
    takes real width and the content shifts once.
  */
  const [railPinned, setRailPinned] = useState(false);

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const children = SUB[item.href];
      const base = children ? { ...item, children } : item;
      if (item.href === "/dashboard") {
        return needsYou > 0 ? { ...base, count: needsYou, attention: true } : base;
      }
      const n = counts[item.href] ?? 0;
      const wants = attention[item.href] ?? false;
      return n === 0 ? { ...base, attention: wants } : { ...base, count: n, attention: wants };
    }),
  }));

  /*
    The command menu is WIRED, 2026-09-04.

    It has existed in packages/ui since the overlay pass and was never mounted, so ⌘K did
    nothing in a product whose whole premise is that a founder should not have to know
    where anything lives. Twenty's command menu is the spine of their product; this is
    the cheapest large win in the build.

    Built from the nav rather than from a second hand-written list, so a section added to
    the rail is searchable the same day.
  */
  const commandItems: CommandItem[] = [
    ...GROUPS.flatMap((g) =>
      g.items.map((item) => ({
        id: item.href,
        label: item.label,
        group: g.label,
        icon: item.icon,
        ...(counts[item.href] ? { hint: String(counts[item.href]) } : {}),
      })),
    ),
    ...Object.entries(SUB).flatMap(([parent, subs]) =>
      subs.map((s) => ({
        id: s.href,
        label: s.label,
        group: GROUPS.flatMap((g) => g.items).find((i) => i.href === parent)?.label ?? "Sections",
      })),
    ),
    ...FOOTER.map((item) => ({
      id: item.href,
      label: item.label,
      group: "Account",
      icon: item.icon,
    })),
  ];

  return (
    /*
      THE SHELL OWNS THE HEIGHT. The page does not scroll; panels scroll inside
      themselves. `h-dvh` with `min-h-0` on the scrolling child is the whole mechanism,
      and `min-h-0` is the class everybody omits: a flex child defaults to
      `min-height: auto` and refuses to shrink under its content, so the inner
      `overflow-auto` never gets a bounded height.
    */
    <div className="bg-background flex h-dvh overflow-hidden">
      <Rail
        groups={groups}
        footer={FOOTER}
        pathname={pathname}
        as={Link}
        onPinnedChange={setRailPinned}
        brand={
          <Link href="/dashboard" className="flex items-center gap-2.5 focus-visible:outline-ring">
            <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center text-caption font-semibold">
              Z
            </span>
          </Link>
        }
      >
        <div className="flex items-center gap-2 px-4 pt-2">
          <span className="bg-surface-sunken text-caption text-muted-foreground flex size-7 shrink-0 items-center justify-center font-medium">
            {email.charAt(0).toUpperCase()}
          </span>
          <form action={signOut} className="ml-auto">
            <IconButton icon={SignOutIcon} label="Sign out" variant="ghost" size="sm" type="submit" />
          </form>
        </div>
      </Rail>

      <div
        className={cx(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          "transition-[margin] duration-[--duration-content] ease-in-out motion-reduce:transition-none",
          railPinned ? "md:ml-(--spacing-sidebar)" : "md:ml-(--spacing-sidebar-rail)",
        )}
      >
        {/*
          The top bar. 56px, and it carries search rather than a page title: the rail
          already says which section you are in and every screen repeats its name in its
          first heading. A third copy has never told anyone anything.
        */}
        <header className="border-border bg-background flex h-14 flex-none items-center gap-3 border-b px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="border-border text-muted-foreground hover:border-border-hover hover:text-foreground focus-visible:outline-ring flex h-8 w-56 shrink-0 items-center gap-2 border px-2.5 transition-[color,border-color] duration-[--duration-hover-out] ease-out hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <MagnifyingGlassIcon size={16} aria-hidden="true" />
            <span className="text-body-sm">Search</span>
            <kbd className="text-caption border-border ml-auto border px-1 font-mono">⌘K</kbd>
          </button>
          {announcement ? (
            <div className="border-destructive bg-destructive-subtle flex h-8 min-w-0 flex-1 items-center gap-2 border px-2.5">
              <WarningIcon
                size={12}
                weight="fill"
                className="text-destructive-ink shrink-0"
                aria-hidden="true"
              />
              <p className="text-caption text-destructive-ink min-w-0 flex-1 truncate">
                <span className="font-semibold">Waiting on you.</span> {announcement.message}
              </p>
              {/*
                The button is NOT destructive-on-destructive.

                Red text in a red-bordered box on a red tint is three statements of the
                same thing and none of them separates the control from the sentence: the
                action stopped looking like a control at all. The strip already says
                "something is wrong" three ways over — tint, ink, filled icon — so the
                button's job is the opposite one: be the thing you can press.

                Solid --foreground on the tint. The darkest, plainest, highest-contrast
                object in the strip, which is what a button in an alert should be.
              */}
              <Link
                href={announcement.href}
                className="text-caption bg-foreground text-background hover:bg-foreground/85 focus-visible:outline-ring shrink-0 px-2.5 py-1 font-medium transition-[background-color] duration-[--duration-hover-out] ease-out hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-1"
              >
                {announcement.action}
              </Link>
            </div>
          ) : (
            /* Nothing pending. The strip does not vanish — it says so, quietly, because
               "nothing is waiting on you" is the answer to the question a founder opens
               the product to ask, and an empty gap answers nothing. */
            <div className="text-caption text-muted-foreground flex min-w-0 flex-1 items-center gap-2">
              <CheckCircleIcon size={12} weight="fill" className="text-success shrink-0" aria-hidden="true" />
              <span className="truncate">Nothing is waiting on you.</span>
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <IconButton icon={BellIcon} label="Notifications" variant="ghost" />
          </div>
        </header>

        {/*
          The announcement rides IN the top bar, on the search line. 2026-09-04.

          It was a 48px band of its own under the chrome, which on every screen pushed the
          actual content down by a full row to say one sentence. A founder opening the
          product does need to know their filing is blocked; they do not need a quarter of
          the first fold spent on it.

          Compressed to a strip beside the search: the tone still carries (destructive
          tint, destructive ink, filled icon), the sentence still reads, and the action is
          still one click. It truncates rather than wraps, because a chrome element that
          changes height changes the height of everything below it.

          `min-w-0` on the strip and `truncate` on the sentence are what let it shrink
          past its content instead of shoving the bell off the bar.
        */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandMenu
        items={commandItems}
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onSelect={(item) => {
          setCommandOpen(false);
          router.push(item.id);
        }}
        placeholder="Go to a section, or search what ZeroCorp has built…"
      />
    </div>
  );
}
