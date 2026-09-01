"use client";

import { useTransition } from "react";
import { PromptDock, PromptHero } from "@zerocorp/ui";
import { startInterview } from "./assessment/actions";

/**
 * The landing IS the first question — D18.
 *
 * The opening question is fixed and costs no model call, so making a visitor click
 * through to a second page to answer it buys nothing. They type here, press send, and
 * arrive in the conversation with their answer already recorded.
 *
 * One click removed, one page transition removed, and nothing is spent on a visitor who
 * closes the tab.
 */
export function Landing() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-5 sm:px-8">
        <span className="text-label tracking-tight">ZeroCorp</span>
        <span className="text-body-sm text-muted-foreground">Free business assessment</span>
      </header>

      <div className="flex flex-1 items-center">
        <PromptHero
          title={
            <>
              Tell us where you are.
              <br />
              We build the business system.
            </>
          }
          subtitle="Describe what you are building. ZeroCorp works out what is missing, what to build first, and what it costs. No account, no card, about three minutes."
        >
          <PromptDock
            onSubmit={(text) => startTransition(() => startInterview(text))}
            disabled={pending}
            placeholder="I design brand identities for early-stage software companies."
            hint="Start anywhere. We will ask about the rest."
          />
        </PromptHero>
      </div>
    </div>
  );
}
