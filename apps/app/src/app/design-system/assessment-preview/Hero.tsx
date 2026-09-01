"use client";

import { PromptDock, PromptHero } from "@zerocorp/ui";

/**
 * The landing, built from the shared PromptHero.
 *
 * The pattern is borrowed; the skin is not. Geist rather than a serif, our own palette,
 * radius 0, Phosphor. A hero that looks like someone else's product sells someone else's
 * product.
 */
export function Hero({ onStart }: { onStart: (answer: string) => void }) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
        <span className="text-label tracking-tight">ZeroCorp</span>
        <span className="text-body-sm text-muted-foreground">Free business assessment</span>
      </header>

      <div className="flex flex-1 items-center">
        <PromptHero
          title={<>Tell us where you are.<br />We build the business system.</>}
          subtitle="Describe what you are building. ZeroCorp works out what is missing, what to build first, and what it costs. No account, no card, about three minutes."
          footnote={
            <>
              <span>US LLC · C-Corp · UK Ltd · LLP</span>
              <span>Company, brand, site, email, content, prospects</span>
            </>
          }
        >
          <PromptDock
            onSubmit={onStart}
            placeholder="I design brand identities for early-stage software companies."
            hint="Start anywhere. We will ask about the rest."
          />
        </PromptHero>
      </div>
    </div>
  );
}
