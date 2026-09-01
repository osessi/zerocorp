import type { TenantContext } from "@zerocorp/contracts";

/**
 * What each V1 block's screen reads.
 *
 * One port per block rather than one repository for the whole tenant. A read port that
 * grows to "everything about a business" stops having a subject, and so does the screen
 * built on it. Each of these answers the question its own page asks and nothing else.
 */

export interface CompanyView {
  readonly company: {
    readonly id: string;
    readonly legalName: string;
    readonly jurisdictionCode: string;
    readonly status: string;
    readonly origin: string;
    readonly formationDate: string | null;
  } | null;
  readonly registrations: readonly {
    readonly kind: string;
    readonly authority: string;
    readonly identifier: string | null;
    readonly status: string;
  }[];
  readonly request: {
    readonly id: string;
    readonly status: string;
    readonly jurisdictionCode: string;
    readonly entityTypeId: string;
  } | null;
  readonly orders: readonly {
    readonly id: string;
    readonly status: string;
    readonly providerCode: string;
    readonly rejectionReason: string | null;
  }[];
  readonly documents: readonly { readonly id: string; readonly type: string; readonly issuedAt: Date | null }[];
  readonly openRfis: readonly { readonly id: string; readonly question: string; readonly dueAt: Date | null }[];
}

export interface BrandView {
  readonly businessName: string;
  readonly description: string | null;
  readonly identity: {
    readonly name: string | null;
    readonly positioning: string | null;
    readonly icp: string | null;
    readonly valueProposition: string | null;
    readonly toneOfVoice: string | null;
    readonly colors: readonly string[];
    readonly status: string;
  } | null;
}

export interface WebsiteView {
  readonly site: { readonly id: string; readonly status: string; readonly publishedAt: Date | null } | null;
  readonly domain: {
    readonly hostname: string;
    readonly status: string;
    readonly dnsStatus: string;
    readonly sslStatus: string;
  } | null;
  readonly pages: readonly {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly type: string;
    readonly status: string;
  }[];
}

export interface EmailView {
  readonly domain: {
    readonly hostname: string;
    readonly spfStatus: string;
    readonly dkimStatus: string;
    readonly dmarcStatus: string;
    readonly warmupStatus: string;
    readonly warmupDay: number;
    readonly dailyLimit: number;
    readonly reputationScore: number | null;
  } | null;
  readonly mailboxes: readonly {
    readonly id: string;
    readonly address: string;
    readonly status: string;
    readonly dailyLimit: number;
  }[];
}

export interface ContentView {
  readonly keywords: readonly {
    readonly id: string;
    readonly keyword: string;
    readonly intent: string | null;
    readonly volume: number | null;
    readonly difficulty: number | null;
    readonly status: string;
  }[];
  readonly posts: readonly {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
    readonly status: string;
    readonly scheduledFor: Date | null;
    readonly publishedAt: Date | null;
  }[];
}

export interface CustomersView {
  readonly lists: readonly {
    readonly id: string;
    readonly name: string;
    readonly source: string | null;
    readonly leadCount: number;
  }[];
  readonly recent: readonly {
    readonly id: string;
    readonly companyName: string;
    readonly domain: string | null;
    readonly country: string | null;
    readonly industry: string | null;
    readonly status: string;
    /** Why we may hold this record. A row without one is a liability, not a lead — C2. */
    readonly consentBasis: string | null;
  }[];
  readonly total: number;
}

export interface SettingsView {
  readonly tenantName: string;
  readonly plan: string;
  readonly subscriptionStatus: string | null;
  readonly creditBalance: number;
  readonly members: readonly { readonly email: string; readonly role: string; readonly status: string }[];
}

export interface BlocksRepository<TTx = unknown> {
  company(tx: TTx, ctx: TenantContext): Promise<CompanyView>;
  brand(tx: TTx, ctx: TenantContext): Promise<BrandView | null>;
  website(tx: TTx, ctx: TenantContext): Promise<WebsiteView>;
  email(tx: TTx, ctx: TenantContext): Promise<EmailView>;
  content(tx: TTx, ctx: TenantContext): Promise<ContentView>;
  customers(tx: TTx, ctx: TenantContext): Promise<CustomersView>;
}

/** Settings reads GLOBAL tables (members, the tenant itself), so it takes a system tx. */
export interface SettingsRepository<TTx = unknown> {
  settings(systemTx: TTx, tenantTx: TTx, ctx: TenantContext): Promise<SettingsView>;
}
