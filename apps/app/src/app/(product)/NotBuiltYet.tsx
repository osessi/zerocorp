import { PageHeader, StatusBadge } from "@zerocorp/ui";

/**
 * A block that is planned and not built.
 *
 * Not a placeholder pretending to be a feature. CLAUDE_CODE_RULES.md §23 forbids fake
 * implementations, and a page with mock charts on it is exactly that: it teaches a
 * founder that something works when it does not.
 *
 * This says what the block will do, what it needs first, and that it is not there yet.
 * A 404 would be worse — the navigation is the product's own map of what it does, and a
 * dead link on your own map is a defect.
 */
export function NotBuiltYet({
  title,
  does,
  needs,
}: {
  title: string;
  does: string;
  needs: string;
}) {
  return (
    <>
      <PageHeader title={title} meta={<StatusBadge tone="neutral">Not built yet</StatusBadge>} />
      <div className="flex max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-overline text-muted-foreground">What this will do</h2>
          <p className="text-body text-pretty">{does}</p>
        </div>
        <div className="border-border flex flex-col gap-2 border-t pt-6">
          <h2 className="text-overline text-muted-foreground">What it needs first</h2>
          <p className="text-body-sm text-muted-foreground text-pretty">{needs}</p>
        </div>
      </div>
    </>
  );
}
