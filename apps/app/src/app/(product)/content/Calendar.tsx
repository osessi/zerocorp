import { cx } from "@zerocorp/ui";

/**
 * The editorial calendar.
 *
 * Three scheduled articles with nowhere to see them was the gap most visible to a
 * customer, and Content is a screen they open weekly. The question it answers is not
 * "what did I write" — the article list already answers that — it is "is anything going
 * out, and when".
 *
 * Four weeks, because that is the horizon a founder plans over: a month is the unit a
 * content cadence is discussed in, and a longer view would be mostly empty cells.
 */
const DAY = 86_400_000;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  // Monday-first. Sunday is 0 in JS, which puts it at the wrong end of the week.
  const shift = (copy.getDay() + 6) % 7;
  copy.setTime(copy.getTime() - shift * DAY);
  return copy;
}

export function Calendar({
  posts,
}: {
  posts: readonly { id: string; title: string; status: string; publishedAt: Date | null; scheduledFor: Date | null }[];
}) {
  const first = startOfWeek(new Date());
  const cells = Array.from({ length: 28 }, (_, i) => new Date(first.getTime() + i * DAY));

  // A post lands on the day it goes out: scheduled ones on their date, published ones on
  // the date they went. Drafts have no date and are deliberately absent — a calendar is
  // for things with a time, and a draft in a cell would be a lie about when it ships.
  const byDay = new Map<string, { title: string; status: string }[]>();
  for (const p of posts) {
    const when = p.scheduledFor ?? p.publishedAt;
    if (!when) continue;
    const key = new Date(when).toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), { title: p.title, status: p.status }]);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((d) => (
          <span key={d} className="text-caption text-muted-foreground px-2 py-1 text-center">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((date) => {
          const key = date.toISOString().slice(0, 10);
          const entries = byDay.get(key) ?? [];
          const isToday = key === today;
          const past = key < today;

          return (
            <div
              key={key}
              className={cx(
                "border-border flex min-h-20 flex-col gap-1 border p-1.5",
                past ? "bg-muted" : "bg-surface",
                isToday && "bg-accent-highlight/15",
              )}
            >
              <span
                className={cx(
                  "text-caption font-mono tabular-nums",
                  isToday ? "bg-accent-highlight text-accent-highlight-ink rounded-sm px-1 font-semibold" : "text-muted-foreground",
                )}
              >
                {date.getDate()}
              </span>
              {entries.slice(0, 2).map((e) => (
                <span
                  key={e.title}
                  title={e.title}
                  className={cx(
                    "text-caption rounded-sm truncate px-1 py-0.5",
                    e.status === "published"
                      ? "bg-success-subtle text-success-ink border-success border"
                      : "bg-processing-subtle text-processing-ink border-processing border",
                  )}
                >
                  {e.title}
                </span>
              ))}
              {entries.length > 2 ? (
                <span className="text-caption text-muted-foreground px-1">+{entries.length - 2}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-caption text-muted-foreground">
        Four weeks from this Monday. Drafts have no date and are not shown — the article list has them.
      </p>
    </div>
  );
}
