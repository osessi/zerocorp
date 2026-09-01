"use client";

import { useState, useTransition } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, Button, Field, FocusedFlowLayout, Input } from "@zerocorp/ui";
import { signIn } from "./actions";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, password);
      if (result && !result.ok) setError(result.error ?? "That did not work.");
    });
  }

  return (
    <FocusedFlowLayout
      forward={
        <Button variant="primary" icon={ArrowRightIcon} iconPosition="end" onClick={submit} loading={pending}>
          Sign in
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-overline text-muted-foreground">ZeroCorp</p>
          <h1 className="text-h2">Sign in</h1>
        </div>

        {error ? <Alert tone="danger" title="That did not work">{error}</Alert> : null}

        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Email">
            <Input type="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button type="submit" className="sr-only">
            Sign in
          </button>
        </form>
      </div>
    </FocusedFlowLayout>
  );
}
