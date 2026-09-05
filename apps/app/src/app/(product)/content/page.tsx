import { redirect } from "next/navigation";
import { CalendarBlankIcon } from "@phosphor-icons/react/dist/ssr";
import {
  ButtonLink,
  CellAction,
  CellIdentity,
  CellStamp,
  CellStatus,
  EmptyState,
  GhostRows,
  ICONS,
  Icon,
  Meter,
  Page,
  Panel,
  Row,
  Rows,
  Section,
  StatCard,
  StatGrid,
  StatusBadge,
  StatusDot,
  Tabs,
} from "@zerocorp/ui";
import { Calendar } from "./Calendar";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { buildContentPlan } from "../build-actions";

export const metadata = { title: "Content · ZeroCorp" };

/**
 * The content block.
 *
 * 2026-09-04: Articles is `full` because it is a queue that gets long and is scanned;
 * Calendar is `work`; Keywords is `work` with a bar behind each row, because a keyword
 * list is a ranked list and a ranked list without bars reads as empty.
 */

const POST_TONE: Record<string, "success" | "processing" | "info" | "neutral"> = {
  published: "success",
  scheduled: "info",
  in_review: "processing",
  draft: "neutral",
};

export default async function ContentPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().content(tx, viewer.ctx),
  );

  const scheduled = view.posts.filter((p) => p.status === "scheduled").length;
  const published = view.posts.filter((p) => p.status === "published").length;
  const drafts = view.posts.filter((p) => p.status === "draft").length;
  const maxVolume = Math.max(1, ...view.keywords.map((k) => k.volume ?? 0));

  return (
    <Tabs
      action={
        <BuildButton action={buildContentPlan} label="Build my content plan" busyLabel="Planning" />
      }
      defaultTab="articles"
      tabs={[
        {
          id: "articles",
          label: "Articles",
          icon: <Icon icon={ICONS.content.icon} size={16} />,
          count: view.posts.length,
          content: (
            <Page width="full">
              {/*
                One denominator for the first three, so the bars are COMPARABLE. Four
                gauges each against their own maximum would be four unrelated numbers
                wearing the same costume.
              */}
              <StatGrid>
                <StatCard
                  label="Published"
                  value={published}
                  detail="live and indexed"
                />
                <StatCard
                  label="Scheduled"
                  value={scheduled}
                  detail="queued to go out"
                />
                <StatCard
                  label="Drafts"
                  value={drafts}
                  detail={drafts > 0 ? "waiting on you" : "none pending"}
                  attention={drafts > 0}
                />
                <StatCard
                  label="Keywords"
                  value={view.keywords.length}
                  detail="being targeted"
                  href="/content#keywords"
                />
              </StatGrid>

              {view.posts.length === 0 ? (
                <EmptyState
                  cause="first-run"
                  icon={ICONS.content.icon}
                  title="Nothing written yet"
                  body="Up to five articles a day, and that is a publication ceiling you can move rather than a generation limit. Search results follow consistency more than volume, so a schedule you keep beats a burst you abandon."
                  action={
                    <BuildButton
                      action={buildContentPlan}
                      label="Build my content plan"
                      busyLabel="Planning"
                    />
                  }
                  ghost={<GhostRows rows={8} columns={[320, 110]} />}
                />
              ) : (
                <Panel>
                  <Panel.Header title="Articles" count={view.posts.length}>
                    <span className="text-caption text-muted-foreground">{published} published</span>
                  </Panel.Header>
                  <Panel.Body padded={false} scroll>
                    <Rows>
                      {/*
                        Three states, three weights. Published articles are history and
                        recede; a draft needs a person and carries the action; a scheduled
                        one sits between. Twenty rows of identical weight is what made this
                        read as a table rather than a queue.
                      */}
                      {view.posts.map((post) => {
                        const isPublished = post.status === "published";
                        const needsYou = post.status === "draft";
                        return (
                          <Row key={post.id} muted={isPublished} waiting={needsYou}>
                            <Icon
                              icon={ICONS.content.icon}
                              size={16}
                              className={isPublished ? "text-muted-foreground" : "text-chart-1"}
                            />
                            <CellIdentity width="content">{post.title}</CellIdentity>
                            <CellStamp>
                              {(post.publishedAt ?? post.scheduledFor)?.toISOString().slice(0, 10) ??
                                "Not set"}
                            </CellStamp>
                            <CellStatus>
                              <StatusBadge tone={POST_TONE[post.status] ?? "neutral"}>
                                {post.status.replace(/_/g, " ")}
                              </StatusBadge>
                            </CellStatus>
                            <CellAction>
                              <ButtonLink href="/content">{needsYou ? "Review" : "Open"}</ButtonLink>
                            </CellAction>
                          </Row>
                        );
                      })}
                    </Rows>
                  </Panel.Body>
                  <Panel.Footer>
                    {published} published · {scheduled} scheduled · {drafts} drafts
                  </Panel.Footer>
                </Panel>
              )}
            </Page>
          ),
        },
        {
          id: "calendar",
          label: "Calendar",
          icon: <Icon icon={CalendarBlankIcon} size={16} />,
          count: scheduled,
          attention: scheduled > 0,
          content: (
            <Page width="work">
              <Section title="Editorial calendar" count={scheduled}>
                <Panel>
                  <Panel.Body>
                    <Calendar posts={view.posts} />
                  </Panel.Body>
                </Panel>
              </Section>
            </Page>
          ),
        },
        {
          id: "keywords",
          label: "Keywords",
          icon: <Icon icon={ICONS.seo.icon} size={16} />,
          count: view.keywords.length,
          content: (
            <Page width="work">
              <Section title="Keywords" count={view.keywords.length}>
                {view.keywords.length === 0 ? (
                  <EmptyState
                    cause="first-run"
                    icon={ICONS.seo.icon}
                    title="No strategy yet"
                    body="Being found starts with choosing the handful of things worth ranking for. That choice comes from your positioning, so the brand is settled before a single article is planned."
                    action={<ButtonLink href="/brand">Open brand</ButtonLink>}
                    ghost={<GhostRows rows={6} columns={[240, 80, 80]} />}
                  />
                ) : (
                  <Panel>
                    <Panel.Header title="Keywords" count={view.keywords.length} />
                    <Panel.Body padded={false}>
                      <Rows>
                        {view.keywords.map((keyword) => (
                          /* The bar is search volume as a share of the biggest term. A
                             keyword list is a RANKED list, and a ranked list with no
                             visual ranking is a spreadsheet. */
                          <Row key={keyword.id} proportion={(keyword.volume ?? 0) / maxVolume}>
                            <Icon icon={ICONS.seo.icon} size={16} className="text-muted-foreground" />
                            <CellIdentity width="content">{keyword.keyword}</CellIdentity>
                            <CellStatus width="marker">
                              <Meter
                                value={(keyword.volume ?? 0) / maxVolume}
                                size={12}
                                label="search volume"
                              />
                            </CellStatus>
                            <span className="text-caption w-20 shrink-0 text-right font-mono tabular-nums">
                              {keyword.volume ?? "Not set"}
                            </span>
                            <span className="text-caption text-muted-foreground w-20 shrink-0 text-right font-mono tabular-nums">
                              {keyword.difficulty ?? "Not set"}
                            </span>
                            {/* A dot, not a badge. Ten identical `targeting` chips is ten
                                boxes competing with the data they annotate. */}
                            <CellStatus>
                              <StatusDot
                                tone={keyword.status === "targeting" ? "success" : "neutral"}
                                muted
                              >
                                {keyword.status}
                              </StatusDot>
                            </CellStatus>
                          </Row>
                        ))}
                      </Rows>
                    </Panel.Body>
                    <Panel.Footer>Volume and difficulty are refreshed weekly</Panel.Footer>
                  </Panel>
                )}
              </Section>
            </Page>
          ),
        },
      ]}
    />
  );
}
