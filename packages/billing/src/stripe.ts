import Stripe from "stripe";
import {
  ACTIVATION_CURRENCY,
  ACTIVATION_PRICE_MINOR,
  needsManualReview,
  type PaymentRiskSignal,
} from "@zerocorp/contracts";

/**
 * Stripe, behind an internal abstraction.
 *
 * Nothing above this file imports `stripe`. That is the provider rule (NN-5): every
 * external provider sits behind an interface and is replaceable, and a payment processor
 * is the one you least want spread across route handlers.
 */
export interface CheckoutSession {
  readonly id: string;
  readonly url: string;
}

export interface PaidEvent {
  readonly externalEventId: string;
  readonly eventType: string;
  readonly assessmentToken: string | null;
  readonly email: string | null;
  readonly amountMinor: number;
  readonly currency: string;
  readonly risk: PaymentRiskSignal;
  readonly needsReview: boolean;
}

export interface PaymentProvider {
  createActivationCheckout(input: {
    assessmentToken: string;
    email?: string;
    successUrl: string;
    cancelUrl: string;
    /** Where the visitor said they live. Carried so the webhook can compare it. */
    declaredResidency?: string;
    /** Their IP country, from the edge. Compared, never used to decline. */
    ipCountry?: string;
  }): Promise<CheckoutSession>;

  /** Verifies the signature and returns the event, or throws. Never trusts the body. */
  readPaidEvent(rawBody: string, signature: string): PaidEvent | null;
}

export function createStripePaymentProvider(config: {
  secretKey: string;
  webhookSecret: string;
  priceMinor?: number;
}): PaymentProvider {
  const stripe = new Stripe(config.secretKey, { apiVersion: "2026-08-26.dahlia" });
  const amount = config.priceMinor ?? ACTIVATION_PRICE_MINOR;

  return {
    async createActivationCheckout(input) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        // One line item, priced here rather than by a Stripe Price object, so the price
        // lives in the codebase where OPEN_DECISIONS can be read beside it.
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: ACTIVATION_CURRENCY.toLowerCase(),
              unit_amount: amount,
              product_data: {
                name: "ZeroCorp Business Activation",
                description: "Company formation, brand, website, email and your first content.",
              },
            },
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        ...(input.email ? { customer_email: input.email } : {}),
        // The assessment token travels on the session, because the webhook is what
        // creates the tenant and it has nothing else to identify the buyer by.
        metadata: {
          assessment_token: input.assessmentToken,
          declared_residency: input.declaredResidency ?? "",
          ip_country: input.ipCountry ?? "",
        },
        // Radar sees these. We do not auto-decline on them; a human reviews.
        payment_intent_data: {
          metadata: {
            assessment_token: input.assessmentToken,
            declared_residency: input.declaredResidency ?? "",
            ip_country: input.ipCountry ?? "",
          },
        },
      });

      if (!session.url) throw new Error("Stripe returned a session with no URL");
      return { id: session.id, url: session.url };
    },

    readPaidEvent(rawBody, signature) {
      // constructEvent verifies the signature. A webhook body is attacker-controlled
      // until this line returns, and treating it as trusted is how fake payments happen.
      const event = stripe.webhooks.constructEvent(rawBody, signature, config.webhookSecret);
      if (event.type !== "checkout.session.completed") return null;

      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") return null;

      const meta = session.metadata ?? {};
      const risk: PaymentRiskSignal = {
        declaredResidency: meta["declared_residency"] || null,
        // Stripe does not always return a card country; an absent signal must not
        // manufacture a review.
        cardCountry: (session.customer_details?.address?.country ?? null) || null,
        ipCountry: meta["ip_country"] || null,
      };

      return {
        externalEventId: event.id,
        eventType: event.type,
        assessmentToken: meta["assessment_token"] || null,
        email: session.customer_details?.email ?? session.customer_email ?? null,
        amountMinor: session.amount_total ?? 0,
        currency: (session.currency ?? ACTIVATION_CURRENCY).toUpperCase(),
        risk,
        needsReview: needsManualReview(risk),
      };
    },
  };
}
