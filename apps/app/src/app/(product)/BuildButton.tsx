"use client";

import { useState, useTransition } from "react";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, Button } from "@zerocorp/ui";
import type { BuildResult } from "./build-actions";

/**
 * The button that makes a block exist.
 *
 * It reports failure in place rather than silently doing nothing. A generator that
 * cannot run because the Business Brain is thin has something useful to say, and
 * swallowing it leaves a founder pressing a button that appears to work.
 */
export function BuildButton({
  action,
  label,
  busyLabel,
}: {
  action: () => Promise<BuildResult>;
  label: string;
  busyLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="primary"
        icon={SparkleIcon}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await action();
            if (!result.ok) setError(result.error ?? "That did not work.");
          })
        }
      >
        {pending ? busyLabel : label}
      </Button>
      {error ? (
        <div className="max-w-sm">
          <Alert tone="danger" title="Nothing was changed">
            {error}
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
