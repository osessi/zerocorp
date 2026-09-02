"use client";

import { useState, useTransition } from "react";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, Button, Field, Input } from "@zerocorp/ui";
import { setUpEmail } from "../build-actions";

export function SetUpEmail() {
  const [hostname, setHostname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-border flex flex-col gap-4 border border-dashed p-6">
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-medium">Set up your sending domain</p>
        <p className="text-body-sm text-muted-foreground max-w-prose text-pretty">
          Use the domain your website is on. Sending from a subdomain of it keeps the
          reputation you build here separate from anything else you ever send.
        </p>
      </div>

      {error ? (
        <Alert tone="danger" title="Nothing was changed">
          {error}
        </Alert>
      ) : null}

      <div className="flex max-w-md flex-col gap-3">
        <Field label="Domain">
          <Input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="acme.com"
            autoComplete="off"
          />
        </Field>
        <div>
          <Button
            variant="primary"
            icon={SparkleIcon}
            loading={pending}
            disabled={hostname.trim().length === 0}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await setUpEmail(hostname);
                if (!result.ok) setError(result.error ?? "That did not work.");
              })
            }
          >
            {pending ? "Setting up" : "Set up email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
