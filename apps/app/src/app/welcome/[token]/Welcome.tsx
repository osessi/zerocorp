"use client";

import { useState, useTransition } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, Button, Field, FocusedFlowLayout, Input } from "@zerocorp/ui";
import { createAccount } from "./actions";

export function Welcome({ token, planTitle }: { token: string; planTitle: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createAccount(token, email, password);
      if (result && !result.ok) setError(result.error ?? "That did not work.");
    });
  }

  return (
    <FocusedFlowLayout
      forward={
        <Button
          variant="primary"
          icon={ArrowRightIcon}
          iconPosition="end"
          onClick={submit}
          loading={pending}
          disabled={email.length === 0 || password.length === 0}
        >
          Create my account
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-overline text-muted-foreground">Your plan is approved</p>
          <h1 className="text-h2 text-balance">{planTitle}</h1>
          <p className="text-body-sm text-muted-foreground max-w-prose">
            Create the account that will own it. Everything you answered is already saved
            against it.
          </p>
        </div>

        {error ? <Alert tone="danger" title="That did not work">{error}</Alert> : null}

        <div className="flex flex-col gap-5">
          <Field label="Email" description="Where we send your documents and your progress.">
            <Input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" description="At least 12 characters. Length matters more than punctuation.">
            <Input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>

        <Alert tone="info" title="No payment is taken yet">
          Card payment is not connected in this build. Your account and your plan are real
          and saved; the charge is not.
        </Alert>
      </div>
    </FocusedFlowLayout>
  );
}
