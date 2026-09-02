import { redirect } from "next/navigation";
import { ArticleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, PageHeader, StatusBadge, StatusDot } from "@zerocorp/ui";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { buildContentPlan } from "../build-actions";
import { Empty, Panel, Row, Rows } from "../ui";

export const metadata = { title: "Content — ZeroCorp" };

const POST_TONE: Record<string, "success" | "processing" | "info" | "neutral"> = {
  published: "success",
  scheduled: "info",
  in_review: "processing",
  draft: "neutral",
};

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().content(tx, viewer.ctx),
  );

  const published = view.posts.filter((p) => p.status === "published").length;

  return (
    <>
      <PageHeader
        title="Content"
        subtitle="What you want to be found for, and what gets written about it"
        meta={
          <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
            {published} published
          </span>
        }
        actions={<BuildButton action={buildContentPlan} label="Build my content plan" busyLabel="Planning" />}
      />

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        <Panel title="Keywords" count={view.keywords.length}>
          {view.keywords.length === 0 ? (
            <Empty
              title="No strategy yet"
              body="Being found starts with choosing the handful of things worth ranking for. That choice comes from your positioning, so the brand is settled before a single article is planned."
            />
          ) : (
            <Rows>
              {view.keywords.map((keyword) => (
                <Row key={keyword.id}>
                  <MagnifyingGlassIcon size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-body-sm min-w-0 flex-1">{keyword.keyword}</span>
                  <span className="text-caption text-chart-3 w-20 shrink-0 text-right font-mono tabular-nums">
                    {keyword.volume ?? "—"}
                  </span>
                  <span className="text-caption text-chart-4 w-20 shrink-0 text-right font-mono tabular-nums">
                    {keyword.difficulty ?? "—"}
                  </span>
                  {/* A dot, not a badge. Ten identical `targeting` chips stacked is ten
                      boxes competing with the data they annotate — the motivating case
                      StatusDot was built for (§21). Muted, because when every row carries
                      the same status the status is not the news; the keyword is. */}
                  <StatusDot tone={keyword.status === "targeting" ? "success" : "neutral"} muted>
                    {keyword.status}
                  </StatusDot>
                </Row>
              ))}
            </Rows>
          )}
        </Panel>

        <Panel title="Articles" count={view.posts.length}>
          {view.posts.length === 0 ? (
            <Empty
              title="Nothing written yet"
              body="Up to five articles a day, and that is a publication ceiling you can move rather than a generation limit. Search results follow consistency more than volume, so a schedule you keep beats a burst you abandon."
            />
          ) : (
            <Rows>
              {/*
                Three states, three weights. Published articles are history and recede;
                a draft is the thing that needs a person and carries the action; a
                scheduled one sits between the two. Twenty rows of identical weight is
                what made this read as a table rather than a queue.
              */}
              {view.posts.map((post) => {
                const published = post.status === "published";
                const needsYou = post.status === "draft";
                return (
                  <Row key={post.id} muted={published}>
                    <ArticleIcon
                      size={18}
                      className={published ? "text-muted-foreground shrink-0" : "text-chart-1 shrink-0"}
                      aria-hidden="true"
                    />
                    <span
                      className={published ? "text-body-sm text-muted-foreground min-w-0 flex-1" : "text-body-sm min-w-0 flex-1 font-medium"}
                    >
                      {post.title}
                    </span>
                    <span className="text-caption text-muted-foreground font-mono tabular-nums">
                      {(post.publishedAt ?? post.scheduledFor)?.toISOString().slice(0, 10) ?? "—"}
                    </span>
                    <StatusBadge tone={POST_TONE[post.status] ?? "neutral"}>{post.status.replace(/_/g, " ")}</StatusBadge>
                    {needsYou ? <ButtonLink href="/content">Review</ButtonLink> : null}
                  </Row>
                );
              })}
            </Rows>
          )}
        </Panel>
      </div>
    </>
  );
}
