import { getBlocksRepository, getUnitOfWork } from "../../../../server/container";
import { getViewer } from "../../../../server/session";

/**
 * CSV export of the lead list.
 *
 * §29.3 block 9 ships "search · filtering · saved lists · CSV export" in V1. Export is
 * what a founder does with a list on day one — open it, look at it, send it somewhere.
 * Filtering matters at five hundred leads, not fifteen, so it is deliberately not here.
 *
 * Leads with no lawful basis are EXCLUDED, not merely marked. §29.3 is explicit that a
 * prospect row without one "is a liability rather than a lead, and it will not be
 * exported" — a warning on screen that still lets the row leave in a file is not a
 * control, it is a note.
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return new Response("Not found", { status: 404 });

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().customers(tx, viewer.ctx),
  );

  const exportable = view.recent.filter((l) => l.consentBasis !== null);
  const withheld = view.recent.length - exportable.length;

  const header = ["company", "domain", "email", "country", "industry", "status", "lawful_basis"];
  const rows = exportable.map((l) => [
    l.companyName,
    l.domain ?? "",
    l.email ?? "",
    l.country ?? "",
    l.industry ?? "",
    l.status,
    l.consentBasis ?? "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="zerocorp-leads-${stamp}.csv"`,
      // The count of what was held back, so a founder can reconcile the file against the
      // screen instead of wondering which rows went missing.
      "x-zerocorp-withheld": String(withheld),
      "cache-control": "no-store",
    },
  });
}

/**
 * RFC 4180 quoting.
 *
 * A company name with a comma in it is normal — "Cardinal & Co, Inc" — and a naive join
 * turns one row into two columns of nonsense. The leading-character guard is separate:
 * a cell starting with = + - or @ is executed as a formula by Excel and Sheets, which is
 * CSV injection, and a lead list is exactly the file someone opens in a spreadsheet.
 */
function escapeCell(value: string): string {
  const risky = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(risky) ? `"${risky.replace(/"/g, '""')}"` : risky;
}
