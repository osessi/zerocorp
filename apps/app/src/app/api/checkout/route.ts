import { NextResponse } from "next/server";
import { getPaymentProvider } from "../../../server/container";

/**
 * Starts checkout for an approved assessment.
 *
 * The assessment token is the only identity that exists at this point — the buyer has no
 * account yet, and will not have one until the webhook creates their tenant. The token
 * travels on the Stripe session so the webhook can find its way back.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  if (!provider) {
    return NextResponse.json({ error: "Payments are not configured on this deployment." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as
    | { token?: string; email?: string; residency?: string }
    | null;
  if (!body?.token) {
    return NextResponse.json({ error: "Missing assessment token" }, { status: 400 });
  }

  const origin = process.env["APP_URL"] ?? new URL(request.url).origin;
  // The edge gives us a country for free. Compared against the declared residency and the
  // card country, never used on its own to decline anything.
  const ipCountry = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? undefined;

  try {
    const session = await provider.createActivationCheckout({
      assessmentToken: body.token,
      ...(body.email ? { email: body.email } : {}),
      ...(body.residency ? { declaredResidency: body.residency } : {}),
      ...(ipCountry ? { ipCountry } : {}),
      successUrl: `${origin}/welcome/${body.token}`,
      cancelUrl: `${origin}/assessment/${body.token}/pricing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (cause) {
    console.error("[checkout] could not create a session", cause);
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 502 });
  }
}
