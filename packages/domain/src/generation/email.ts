/**
 * Email setup, and the warm-up ramp.
 *
 * The ramp is the whole point: mailbox providers judge a new domain by how its volume
 * grows, not by how much it sends. Starting at the target volume is what gets a domain
 * filtered, and no amount of correct SPF fixes a reputation earned that way.
 */

export interface DnsRecord {
  readonly kind: "TXT" | "CNAME" | "MX";
  readonly host: string;
  readonly value: string;
  readonly purpose: "spf" | "dkim" | "dmarc" | "mx";
}

/**
 * What has to be in DNS before a single message goes out.
 *
 * The DKIM value is a placeholder until a provider issues a key; it is marked as such
 * rather than being a plausible-looking string, because a founder pasting a fake key
 * into their DNS gets a domain that authenticates against nothing.
 */
export function dnsRecordsFor(hostname: string): DnsRecord[] {
  return [
    { kind: "TXT", host: hostname, value: "v=spf1 include:_spf.zerocorp.dev ~all", purpose: "spf" },
    { kind: "CNAME", host: `zc._domainkey.${hostname}`, value: "ISSUED_BY_PROVIDER", purpose: "dkim" },
    {
      kind: "TXT",
      host: `_dmarc.${hostname}`,
      // p=none to start. Quarantine before you can read a report is how legitimate mail
      // gets dropped by your own policy.
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${hostname}`,
      purpose: "dmarc",
    },
  ];
}

export const WARMUP_DAYS = 28;

/**
 * The daily ceiling on day N of warm-up.
 *
 * Roughly doubling every four days from 5 to about 400. Gentler than most published
 * ramps on purpose: a founder's first domain has no history at all, and the cost of
 * going slowly is three extra weeks, while the cost of going fast is a domain that
 * cannot be used.
 */
export function warmupLimit(day: number): number {
  if (day <= 0) return 0;
  const capped = Math.min(day, WARMUP_DAYS);
  return Math.round(5 * Math.pow(2, (capped - 1) / 4));
}

export function warmupSchedule(): Array<{ day: number; limit: number }> {
  return Array.from({ length: WARMUP_DAYS }, (_, i) => ({ day: i + 1, limit: warmupLimit(i + 1) }));
}
