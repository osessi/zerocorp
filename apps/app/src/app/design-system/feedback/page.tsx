"use client";

import { useEffect, useState } from "react";
import { Button, Skeleton, SkeletonText, Spinner, StatusBadge, type IconSize } from "@zerocorp/ui";

/**
 * Spinner and Skeleton — visual review surface.
 *
 * What this page has to prove: the spinner reads at every §11 size in both themes, a
 * skeleton occupies EXACTLY the space its content will occupy — the whole point, and the
 * only thing a screenshot can actually settle — and neither is ever the only signal that
 * something is loading. docs/DESIGN_SYSTEM.md §19.
 */

const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(" ");
const SIZES: IconSize[] = [12, 16, 20, 24, 32, 40];

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">{title}</h2>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

/** The loaded row and its skeleton, rendered from the same measurements. */
function BusinessRow({ loading }: { loading: boolean }) {
  return (
    <div className="border-border flex items-center gap-4 border-b px-3 py-2 last:border-b-0">
      {loading ? (
        <Skeleton className="h-5 w-48" />
      ) : (
        <span className="text-body-sm text-foreground w-48">Northwind Studio LLC</span>
      )}
      {loading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span className="text-body-sm text-muted-foreground w-24">Wyoming</span>
      )}
      {loading ? (
        <Skeleton className="h-5 w-28" />
      ) : (
        <span className="text-body-sm text-muted-foreground w-28 font-mono">Mar 4, 2026</span>
      )}
      {loading ? (
        // Rebuilt from the badge's own box tokens — text-caption line box (16) + py-0.5
        // (4) + border (2) — never from its measured height. A skeleton sized by a
        // hard-coded pixel is the defect this page exists to disprove.
        <span className="text-caption inline-flex border border-transparent py-0.5">
          <Skeleton className="h-4 w-20" />
        </span>
      ) : (
        <StatusBadge tone="success">Active</StatusBadge>
      )}
    </div>
  );
}

export default function FeedbackReviewPage() {
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex max-w-(--container-content) flex-col gap-10 p-4 sm:p-8">
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">Spinner · Skeleton</h1>
            <p className="text-body-sm text-muted-foreground">
              Neither is ever the only signal that something is loading.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setLoading((l) => !l)} variant="primary">
              {loading ? "Show loaded" : "Show loading"}
            </Button>
            <Button onClick={() => setDark((d) => !d)}>{dark ? "Light" : "Dark"}</Button>
          </div>
        </header>

        <Section
          title="Spinner — the six §11 sizes"
          note="One glyph, Regular weight, every size. CircleNotch was written inline in four components before this existed."
        >
          <div className="border-border flex flex-wrap items-end gap-8 border p-4">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <Spinner size={size} />
                <span className="text-caption text-muted-foreground font-mono">{size}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Never alone"
          note="Under prefers-reduced-motion the glyph is static. That is only safe because something else always carries the state."
        >
          <div className="border-border flex flex-col gap-4 border p-4">
            <div className="flex flex-wrap items-center gap-6">
              <Button variant="primary" loading>
                Submitting filing
              </Button>
              <span className="text-caption text-muted-foreground">
                label stays visible · aria-busy on the button
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-body-sm inline-flex items-center gap-2">
                <Spinner size={16} label="Checking availability" />
                Checking availability
              </span>
              <span className="text-caption text-muted-foreground">
                standalone · role=status carries the name
              </span>
            </div>
          </div>
        </Section>

        <Section
          title="Skeleton — the same row, loading and loaded"
          note="Toggle it. Nothing may move: a skeleton that is not the size of its content is worse than showing nothing at all."
        >
          <div className="border-border border" id="rows">
            {[0, 1, 2].map((i) => (
              <BusinessRow key={i} loading={loading} />
            ))}
          </div>
        </Section>

        <Section
          title="SkeletonText"
          note="The short last line is the point — a stack of equal bars reads as a table, not a paragraph."
        >
          <div className="border-border grid grid-cols-1 gap-6 border p-4 sm:grid-cols-2">
            <SkeletonText lines={3} />
            <p className="text-body-sm text-muted-foreground">
              The Business Brain keeps one approved description per company and every
              generated surface reads from it, so the site, the email footer and the
              filing cover letter never disagree.
            </p>
          </div>
        </Section>

        <Section
          title="A panel that is busy"
          note="The container owns aria-busy and the announcement; the skeletons inside it are aria-hidden decoration."
        >
          <div
            className={cx("border-border flex flex-col gap-4 border p-4")}
            aria-busy={loading || undefined}
            role="region"
            aria-label="Formation status"
          >
            <div className="flex items-center gap-3">
              {loading ? <Skeleton className="h-7 w-56" /> : <h3 className="text-h4">Northwind Studio LLC</h3>}
              {loading ? (
                <span className="text-caption inline-flex border border-transparent py-0.5">
                  <Skeleton className="h-4 w-24" />
                </span>
              ) : (
                <StatusBadge tone="processing">Filing</StatusBadge>
              )}
            </div>
            {loading ? <SkeletonText lines={2} /> : (
              <p className="text-body-sm text-muted-foreground">
                Submitted to Wyoming on Mar 2. The certificate usually arrives within two
                business days.
              </p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
