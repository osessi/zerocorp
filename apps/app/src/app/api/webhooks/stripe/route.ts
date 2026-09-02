import { NextResponse } from "next/server";
import { getConversionService, getPaymentProvider, getPaymentLedger } from "../../../../server/container";

/**
 * The Stripe webhook. This is where a visitor becomes a customer.
 *
 * Three things it must get right, all of which are how payment integrations break:
 *
 * 1. VERIFY FIRST. The body is attacker-controlled until the signature check returns.
 *    An unverified webhook is a free-tenant endpoint.
 *
 * 2. IDEMPOTENT. Stripe delivers more than once, always — that is a guarantee, not an
 *    edge case. The event id is recorded before conversion and a repeat is a no-op.
 *    `convert` is itself idempotent via convertedTenantId, so this is the second of two
 *    barriers rather than the only one.
 *
 * 3. ACKNOWLEDGE FAST. A 500 makes Stripe retry, and retrying a conversion that half
 *    succeeded is worse than the original failure. Anything recoverable is recorded and
 *    answered 200; only an unverifiable signature is a 4xx.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  if (!provider) return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // The RAW body. Parsing it first and re-serialising changes bytes and breaks the
  // signature, which is the classic way this endpoint silently rejects everything.
  const raw = await request.text();

  let event;
  try {
    event = provider.readPaidEvent(raw, signature);
  } catch (cause) {
    console.error("[stripe] signature rejected", cause);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  // A verified event we do not act on. Acknowledged, so Stripe stops retrying it.
  if (!event) return NextResponse.json({ received: true });

  if (!event.assessmentToken) {
    console.error(`[stripe] paid event ${event.externalEventId} carried no assessment token`);
    return NextResponse.json({ received: true });
  }

  const ledger = getPaymentLedger();
  const already = await ledger.alreadyProcessed("stripe", event.externalEventId);
  if (already) return NextResponse.json({ received: true, duplicate: true });

  try {
    const result = await getConversionService().convert({
      token: event.assessmentToken,
      email: event.email ?? `${event.assessmentToken}@pending.zerocorp.test`,
    });

    await ledger.record({
      tenantId: result.tenantId,
      provider: "stripe",
      externalEventId: event.externalEventId,
      eventType: event.eventType,
      status: event.needsReview ? "needs_review" : "processed",
      risk: event.risk,
    });

    if (event.needsReview) {
      // Three distinct countries between declared residency, card and IP. Not declined —
      // this product's customers travel — but a human looks before anything is filed.
      console.warn(`[stripe] ${event.externalEventId} flagged for manual review`, event.risk);
    }

    return NextResponse.json({ received: true, tenantId: result.tenantId });
  } catch (cause) {
    console.error(`[stripe] conversion failed for ${event.externalEventId}`, cause);
    // 200 on purpose. The payment succeeded; a retry would not fix a conversion bug and
    // would risk a second tenant. This needs a human, and the log is how they find it.
    return NextResponse.json({ received: true, error: "conversion_failed" });
  }
}
