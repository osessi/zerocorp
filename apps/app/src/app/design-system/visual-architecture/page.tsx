import {
  ButtonLink,
  CellAction,
  CellIdentity,
  CellStamp,
  CellStatus,
  CellText,
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
  Sparkline,
  StatCard,
  StatGrid,
  StatusBadge,
  StatusDot,
} from "@zerocorp/ui";
import { ListBulletsIcon } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Visual architecture · ZeroCorp" };

/**
 * The 2026-09-04 visual architecture pass, on one page.
 *
 * A gallery, not a screen: it renders the real components with sample data so the row
 * anatomy, the three empty states, the data primitives and the card treatment can be
 * reviewed side by side without a database.
 *
 * Sample data is marked as such. Nothing here reads a repository.
 */

const LEADS = [
  { name: "Northwind Trading", domain: "northwind.co", country: "US", industry: "Logistics", stage: "replied", p: 1 },
  { name: "Basalt Systems", domain: "basalt.io", country: "DE", industry: "Industrial software", stage: "contacted", p: 0.8 },
  { name: "Ferrier & Co", domain: "ferrier.fr", country: "FR", industry: "Professional services", stage: "qualified", p: 0.6 },
  { name: "Kestrel Analytics", domain: "kestrel.ai", country: "UK", industry: "Data", stage: "enriched", p: 0.4 },
  { name: "Aldona Foods", domain: "aldona.pt", country: "PT", industry: "Food and beverage", stage: "discovered", p: 0.2 },
];

const KEYWORDS = [
  { term: "form an llc in delaware", volume: 14800, difficulty: 62 },
  { term: "registered agent service", volume: 9100, difficulty: 54 },
  { term: "ein for non resident", volume: 5400, difficulty: 38 },
  { term: "single member llc taxes", volume: 3600, difficulty: 41 },
  { term: "delaware franchise tax", volume: 2400, difficulty: 29 },
];

const TONE: Record<string, "success" | "info" | "processing" | "neutral"> = {
  replied: "success",
  qualified: "info",
  contacted: "processing",
  enriched: "processing",
  discovered: "neutral",
};

export default function VisualArchitecturePage() {
  const maxVolume = Math.max(...KEYWORDS.map((k) => k.volume));

  return (
    <Page width="work">
      <div className="flex flex-col gap-3">
        <span className="text-overline text-primary">Design system</span>
        <h1 className="text-h2 text-figure-ink">Visual architecture</h1>
        <p className="text-body text-muted-foreground max-w-prose text-pretty">
          The 2026-09-04 pass, rendered with sample data. Row anatomy, the three empty
          states, the four data primitives and the card treatment.
        </p>
      </div>

      <Section title="Stat cards" count="Midday anatomy">
        <StatGrid>
          <StatCard
            label="Launch progress"
            value="68%"
            detail="6 of 9"
            href="#"
            trend={[2, 3, 3, 5, 4, 6, 8, 7, 9]}
          />
          <StatCard label="Articles published" value={12} detail="+3 scheduled" href="#" />
          <StatCard label="Prospects found" value={148} detail="4 replied" href="#" />
          <StatCard label="Needs you" value={2} detail="blocking your launch" href="#" attention />
        </StatGrid>
      </Section>

      <Section title="Row anatomy" count="typed cells, no border at rest">
        <Panel>
          <Panel.Header title="Recently found" count={LEADS.length}>
            <span className="text-caption text-muted-foreground">4 contactable</span>
          </Panel.Header>
          <Panel.Body padded={false}>
            <Rows>
              {LEADS.map((l) => (
                <Row key={l.domain} muted={l.stage === "discovered"}>
                  <span className="bg-surface-sunken text-caption text-muted-foreground flex size-7 shrink-0 items-center justify-center font-medium">
                    {l.name.slice(0, 2).toUpperCase()}
                  </span>
                  <CellIdentity sub={l.domain}>{l.name}</CellIdentity>
                  <CellStamp width="marker">{l.country}</CellStamp>
                  <CellText>{l.industry}</CellText>
                  <CellStatus width="marker">
                    <Meter value={l.p} size={12} label={`${l.stage} stage`} />
                  </CellStatus>
                  <CellStatus>
                    <StatusDot tone={TONE[l.stage] ?? "neutral"}>{l.stage}</StatusDot>
                  </CellStatus>
                  <CellAction>
                    <ButtonLink href="#">Open</ButtonLink>
                  </CellAction>
                </Row>
              ))}
            </Rows>
          </Panel.Body>
          <Panel.Footer>Showing 5 of 148 · 1 replied</Panel.Footer>
        </Panel>
      </Section>

      <Section title="Bar behind the row" count="Dub, ranked lists">
        <Panel>
          <Panel.Header title="Keywords" count={KEYWORDS.length} />
          <Panel.Body padded={false}>
            <Rows>
              {KEYWORDS.map((k) => (
                <Row key={k.term} proportion={k.volume / maxVolume}>
                  <Icon icon={ICONS.seo.icon} size={16} className="text-muted-foreground" />
                  <CellIdentity width="content">{k.term}</CellIdentity>
                  <CellStatus width="marker">
                    <Meter value={k.volume / maxVolume} size={12} label="search volume" />
                  </CellStatus>
                  <span className="text-caption w-20 shrink-0 text-right font-mono tabular-nums">
                    {k.volume}
                  </span>
                  <span className="text-caption text-muted-foreground w-20 shrink-0 text-right font-mono tabular-nums">
                    {k.difficulty}
                  </span>
                  <CellStatus>
                    <StatusDot tone="success" muted>
                      targeting
                    </StatusDot>
                  </CellStatus>
                </Row>
              ))}
            </Rows>
          </Panel.Body>
          <Panel.Footer>Volume and difficulty are refreshed weekly</Panel.Footer>
        </Panel>
      </Section>

      <Section title="Data primitives" count="Meter · Sparkline · Counter">
        <div className="grid grid-cols-1 gap-(--gap-block) sm:grid-cols-3">
          <div className="border-border bg-surface flex flex-col gap-3 border p-5">
            <span className="text-overline text-muted-foreground">Meter</span>
            <div className="flex items-center gap-4">
              {[0.15, 0.4, 0.65, 0.9, 1].map((v) => (
                <div key={v} className="flex flex-col items-center gap-1.5">
                  <Meter value={v} size={20} />
                  <span className="text-caption text-muted-foreground font-mono">
                    {Math.round(v * 100)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-caption text-muted-foreground">
              12px inline, 100-unit viewBox, butt caps so the arc cannot overstate.
            </p>
          </div>
          <div className="border-border bg-surface flex flex-col gap-3 border p-5">
            <span className="text-overline text-muted-foreground">Sparkline</span>
            <div className="flex items-end gap-4">
              <Sparkline data={[2, 4, 3, 6, 5, 8, 7, 11, 14]} width={110} height={36} />
              <Sparkline data={[9, 8, 8, 6, 7, 4, 3, 3, 2]} width={110} height={36} />
            </div>
            <p className="text-caption text-muted-foreground">
              2px padding, emphasised endpoint, gradient under the line.
            </p>
          </div>
          <div className="border-border bg-surface flex flex-col gap-3 border p-5">
            <span className="text-overline text-muted-foreground">Status</span>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="success">verified</StatusBadge>
              <StatusBadge tone="warning">no basis</StatusBadge>
              <StatusBadge tone="processing">warming</StatusBadge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusDot tone="success">published</StatusDot>
              <StatusDot tone="info">scheduled</StatusDot>
              <StatusDot tone="neutral" muted>
                draft
              </StatusDot>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Empty states" count="three, by cause">
        <div className="grid grid-cols-1 gap-(--gap-block) lg:grid-cols-3">
          <div className="border-border bg-surface border">
            <div className="border-border text-overline text-muted-foreground border-b px-4 py-2">
              first-run
            </div>
            <EmptyState
              cause="first-run"
              icon={ICONS.leads.icon}
              title="Nothing found yet"
              body="Discovery starts once your target is defined."
              action={<ButtonLink href="#">Define my target</ButtonLink>}
              ghost={<GhostRows rows={6} columns={[140, 90]} />}
            />
          </div>
          <div className="border-border bg-surface border">
            <div className="border-border text-overline text-muted-foreground border-b px-4 py-2">
              filtered
            </div>
            <EmptyState
              cause="filtered"
              icon={ListBulletsIcon}
              title="No results"
              body="Try another search, or adjust the filters."
              action={<ButtonLink href="#">Clear filters</ButtonLink>}
              ghost={<GhostRows rows={6} columns={[140, 90]} />}
            />
          </div>
          <div className="border-border bg-surface border">
            <div className="border-border text-overline text-muted-foreground border-b px-4 py-2">
              complete — offers nothing
            </div>
            <EmptyState
              cause="complete"
              title="All done"
              body="Everything is filed. New requests appear here the moment a founder submits one."
              action={<ButtonLink href="#">This is deliberately not rendered</ButtonLink>}
              ghost={<GhostRows rows={6} columns={[140, 90]} />}
            />
          </div>
        </div>
      </Section>

      <Section title="Density" count="36px compact · 48px comfortable">
        <div className="grid grid-cols-1 gap-(--gap-block) lg:grid-cols-2">
          <Panel>
            <Panel.Header title="Compact" count="36px" />
            <Panel.Body padded={false}>
              <Rows>
                {LEADS.slice(0, 4).map((l) => (
                  <Row key={l.domain} density="compact">
                    <CellIdentity>{l.name}</CellIdentity>
                    <CellStamp width="marker">{l.country}</CellStamp>
                    <CellStatus>
                      <StatusDot tone={TONE[l.stage] ?? "neutral"}>{l.stage}</StatusDot>
                    </CellStatus>
                  </Row>
                ))}
              </Rows>
            </Panel.Body>
          </Panel>
          <Panel>
            <Panel.Header title="States" count="hover · focus · active · selected" />
            <Panel.Body padded={false}>
              <Rows>
                <Row>
                  <CellIdentity sub="hover me">Rest</CellIdentity>
                </Row>
                <Row focused>
                  <CellIdentity sub="the keyboard is here">Soft focus</CellIdentity>
                </Row>
                <Row active>
                  <CellIdentity sub="expanded or editing">Active</CellIdentity>
                </Row>
                <Row selected>
                  <CellIdentity sub="in the selection">Selected</CellIdentity>
                </Row>
              </Rows>
            </Panel.Body>
          </Panel>
        </div>
      </Section>
    </Page>
  );
}
