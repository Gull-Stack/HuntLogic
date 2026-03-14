import Stripe from "stripe";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripe.secretKey(), {
      apiVersion: "2025-04-30.basil",
      typescript: true,
    });
  }
  return stripeClient;
}

/**
 * Create or retrieve a Stripe Customer for a user.
 * Stores the customer ID on the user record for reuse.
 */
export async function createOrGetCustomer(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  // Check if user already has a Stripe customer
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { stripeCustomerId: true },
  });

  if (dbUser?.stripeCustomerId) {
    return dbUser.stripeCustomerId;
  }

  // Create new Stripe Customer
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: {
      huntlogicUserId: user.id,
    },
  });

  // Save customer ID to user record
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return customer.id;
}

/**
 * Create a Stripe Checkout Session for an application order.
 */
export async function createCheckoutSession(params: {
  customerId: string;
  orderId: string;
  orderNumber: string;
  lineItems: Array<{
    name: string;
    description?: string;
    amount: number; // in cents
    quantity?: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ["card"],
    mode: "payment",
    line_items: params.lineItems.map((item) => ({
      price_data: {
        currency: config.stripe.currency,
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity ?? 1,
    })),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
    },
    payment_intent_data: {
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      },
    },
  });
}

/**
 * Construct and verify a Stripe webhook event.
 */
export function constructWebhookEvent(
  body: Buffer | string,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    config.stripe.webhookSecret()
  );
}

/**
 * Issue a refund for a payment.
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // in cents, omit for full refund
  reason?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Refund> {
  const stripe = getStripeClient();

  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amount,
    reason:
      (params.reason as Stripe.RefundCreateParams.Reason) ??
      "requested_by_customer",
    metadata: params.metadata,
  });
}

/**
 * Retrieve a payment intent for status checking.
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Build success and cancel URLs for a Stripe Checkout session.
 */
export function buildCheckoutUrls(orderId: string): {
  successUrl: string;
  cancelUrl: string;
} {
  const baseUrl = config.app.url;
  return {
    successUrl: `${baseUrl}/orders/success?orderId=${orderId}`,
    cancelUrl: `${baseUrl}/orders/cancelled?orderId=${orderId}`,
  };
}

/**
 * Generate a unique order number: HL-YYYY-NNNNN
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `HL-${year}-${random}`;
}
