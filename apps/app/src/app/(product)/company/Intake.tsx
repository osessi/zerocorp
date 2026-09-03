"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ISO_3166_1_ALPHA_2, type CountryCode } from "@zerocorp/contracts";
import { einPath, screenResidency } from "@zerocorp/domain";
import { Alert, Button, Field, Select, StatusBadge, cx } from "@zerocorp/ui";

/**
 * Country names from the platform rather than a 249-row map in the repository.
 * Intl.DisplayNames is in every browser and in Node, it is localised for free, and a
 * hand-written list is a list that goes stale the next time a country renames itself.
 */
const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_OPTIONS = ISO_3166_1_ALPHA_2.map((code) => ({
  value: code,
  label: REGION_NAMES.of(code) ?? code,
})).sort((a, b) => a.label.localeCompare(b.label));
import { requestFormation } from "./actions";

/**
 * The formation intake.
 *
 * Residency is the first question and it gates. A resident of a comprehensively
 * sanctioned country is told here, before any money moves — taking $997 and refunding it
 * later is worse than declining at the door: a sanctions exposure, a chargeback, and a
 * founder who was told yes.
 *
 * The EIN answer appears the moment the tax-id box is ticked or not, because "four to
 * eight weeks" is a fine thing to hear while deciding and a terrible thing to discover
 * afterwards. It is the most common complaint about every competitor in this market, and
 * it is caused entirely by telling people late.
 */
export function Intake({
  entities,
  targetMarkets,
}: {
  entities: readonly {
    code: string;
    jurisdictionCode: string;
    customerLabel: string;
    automationLevel: string;
    typicalDaysMin: number;
    typicalDaysMax: number;
  }[];
  /** Where the business sells. Distinct from residency, and never a substitute for it. */
  targetMarkets: readonly string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [residency, setResidency] = useState<CountryCode | "">("");
  const [hasUsTaxId, setHasUsTaxId] = useState(false);
  const [ownerCount, setOwnerCount] = useState("1");
  const [investment, setInvestment] = useState(false);
  const [names, setNames] = useState("");
  const [choice, setChoice] = useState("");

  const screening = residency ? screenResidency(residency) : null;
  const blocked = screening?.outcome === "blocked";
  const ein = residency ? einPath(hasUsTaxId) : null;
  const chosen = entities.find((e) => `${e.jurisdictionCode}:${e.code}` === choice);
  const ready = residency && !blocked && names.trim().length > 0 && chosen;

  function submit() {
    if (!ready || !chosen) return;
    setError(null);
    start(async () => {
      const result = await requestFormation({
        entityTypeCode: chosen.code,
        jurisdictionCode: chosen.jurisdictionCode,
        residencyCountry: residency,
        proposedNames: names.split("\n").map((n) => n.trim()).filter(Boolean).slice(0, 3),
        ownerCount,
        hasUsTaxId,
        wantsExternalInvestment: investment,
        targetMarkets: targetMarkets.length > 0 ? [...targetMarkets] : ["US"],
      });
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-h4">Where do you live?</h2>
          <p className="text-body-sm text-muted-foreground">
            Not where you sell — where you are resident. It decides which structures are open to
            you, how your tax ID is issued, and how long it takes.
          </p>
        </div>

        <Field label="Country of residence" description="Where you are tax resident today.">
          <Select
            options={COUNTRY_OPTIONS}
            placeholder="Choose a country"
            value={residency || null}
            onValueChange={(v) => setResidency((v ?? "") as CountryCode)}
          />
        </Field>

        {blocked ? (
          <Alert tone="danger" title="We cannot form a company for you">
            {screening.reason} Nothing has been charged.
          </Alert>
        ) : screening?.outcome === "review" ? (
          <Alert tone="warning" title="We need to check one thing first">
            {screening.reason} A ZeroCorp operator will confirm before anything is filed.
          </Alert>
        ) : null}
      </section>

      {residency && !blocked ? (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-h4">A few facts that change the filing</h2>

            <label className="border-border hover:bg-accent flex cursor-pointer items-start gap-3 border p-4">
              <input
                type="checkbox"
                checked={hasUsTaxId}
                onChange={(e) => setHasUsTaxId(e.target.checked)}
                className="accent-primary mt-1 size-4"
              />
              <span className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">I have a US SSN or ITIN</span>
                <span className="text-caption text-muted-foreground">
                  Most non-US founders do not. It is not required, it only changes the timeline.
                </span>
              </span>
            </label>

            {/* The honest number, shown before payment rather than after. */}
            {ein ? (
              <div
                className={cx(
                  "flex flex-col gap-1 border p-4",
                  ein.path === "online"
                    ? "border-success bg-success-subtle text-success-ink"
                    : "border-info bg-info-subtle text-info-ink",
                )}
              >
                <span className="text-body-sm font-medium">
                  Your EIN: {ein.typicalDaysMax <= 1 ? "same day" : `${ein.typicalDaysMin} to ${ein.typicalDaysMax} days`}
                </span>
                <span className="text-body-sm">{ein.summary}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="How many owners?" description="Including you.">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={ownerCount}
                  onChange={(e) => setOwnerCount(e.target.value)}
                  className="border-input bg-surface text-body focus-visible:outline-ring w-full border px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </Field>
              <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 border p-4">
                <input
                  type="checkbox"
                  checked={investment}
                  onChange={(e) => setInvestment(e.target.checked)}
                  className="accent-primary size-4"
                />
                <span className="text-body-sm">I plan to raise outside investment</span>
              </label>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-h4">What should it be called?</h2>
              <p className="text-body-sm text-muted-foreground">
                Up to three, best first. Names get rejected for being too close to an existing one,
                and a second choice saves a week.
              </p>
            </div>
            <textarea
              value={names}
              onChange={(e) => setNames(e.target.value)}
              rows={3}
              placeholder={"Northwind Studio LLC\nNorthwind Design LLC"}
              className="border-input bg-surface text-body focus-visible:outline-ring w-full resize-y border p-3 focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Choose the structure</h2>
            <div className="flex flex-col gap-2">
              {entities.map((e) => {
                const key = `${e.jurisdictionCode}:${e.code}`;
                const active = choice === key;
                return (
                  <label
                    key={key}
                    className={cx(
                      "border-border flex cursor-pointer items-center gap-4 border px-5 py-4 transition-[background-color] duration-normal",
                      active ? "bg-surface-sunken" : "hover:bg-accent",
                    )}
                  >
                    <input
                      type="radio"
                      name="structure"
                      checked={active}
                      onChange={() => setChoice(key)}
                      className="accent-primary size-4"
                    />
                    <span className={cx("text-body-sm w-36 shrink-0", active && "font-medium")}>{e.customerLabel}</span>
                    <span className="text-body-sm text-muted-foreground w-24 shrink-0 font-mono">
                      {e.jurisdictionCode.toUpperCase()}
                    </span>
                    <span className="text-caption text-muted-foreground min-w-0 flex-1">
                      Typically {e.typicalDaysMin} to {e.typicalDaysMax} days
                    </span>
                    {/* The honesty field, rendered. A founder is never told a filing is
                        automatic when a ZeroCorp operator does it by hand. */}
                    <StatusBadge tone={e.automationLevel === "automated" ? "success" : "info"}>
                      {e.automationLevel === "automated" ? "Automated" : "Filed by an operator"}
                    </StatusBadge>
                  </label>
                );
              })}
            </div>
          </section>

          {error ? (
            <Alert tone="danger" title="That structure is not available to you">
              {error}
            </Alert>
          ) : null}

          <div className="border-border flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            <p className="text-body-sm text-muted-foreground max-w-prose">
              Nothing is filed yet. This checks you are eligible and records what you asked for.
            </p>
            <Button variant="primary" onClick={submit} disabled={!ready || pending}>
              {pending ? "Checking" : "Check and request"} <ArrowRightIcon size={16} aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
