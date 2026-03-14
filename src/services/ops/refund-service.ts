import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  payments,
  refunds,
  fulfillmentLogs,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createRefund } from "@/services/stripe";

// ========================
// Refund processing
// ========================

/**
 * Initiate a refund for a specific order item.
 *
 * 1. Looks up the item and validates it exists
 * 2. Looks up the order's payment record
 * 3. Calculates refund amount (stateFee + serviceFee)
 * 4. Calls Stripe createRefund
 * 5. Inserts a refunds row
 * 6. Updates item status to "cancelled"
 * 7. Creates fulfillment_log entry with action "refunded"
 * 8. If total refunded equals order grandTotal, marks order as "refunded"
 */
export async function initiateItemRefund(params: {
  orderId: string;
  itemId: string;
  reason: string;
  notes?: string;
  opsUserId: string;
}): Promise<{ refundId: string; amount: string; stripeRefundId: string }> {
  // 1. Look up and validate the item
  const [item] = await db
    .select()
    .from(applicationOrderItems)
    .where(
      and(
        eq(applicationOrderItems.id, params.itemId),
        eq(applicationOrderItems.orderId, params.orderId)
      )
    )
    .limit(1);

  if (!item) {
    throw new Error("Order item not found");
  }

  if (item.status === "cancelled") {
    throw new Error("Item has already been cancelled/refunded");
  }

  // 2. Look up the order and its payment record
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(eq(applicationOrders.id, params.orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found");
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.orderId, params.orderId),
        eq(payments.status, "succeeded")
      )
    )
    .limit(1);

  if (!payment) {
    throw new Error("No successful payment found for this order");
  }

  // 3. Calculate refund amount
  const refundAmount = parseFloat(item.stateFee) + parseFloat(item.serviceFee);

  if (refundAmount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }

  const refundAmountCents = Math.round(refundAmount * 100);

  // 4. Issue Stripe refund
  const stripeRefund = await createRefund({
    paymentIntentId: payment.stripePaymentIntentId,
    amount: refundAmountCents,
    reason: "requested_by_customer",
    metadata: {
      orderId: params.orderId,
      itemId: params.itemId,
      opsUserId: params.opsUserId,
      reason: params.reason,
    },
  });

  // 5. Insert refunds row
  const [refundRecord] = await db
    .insert(refunds)
    .values({
      paymentId: payment.id,
      orderId: params.orderId,
      orderItemId: params.itemId,
      stripeRefundId: stripeRefund.id,
      amount: refundAmount.toFixed(2),
      reason: params.reason,
      status: "succeeded",
      notes: params.notes ?? null,
      initiatedBy: "ops",
      processedAt: new Date(),
      metadata: {
        opsUserId: params.opsUserId,
        stripeRefundId: stripeRefund.id,
      },
    })
    .returning();

  if (!refundRecord) {
    throw new Error("Failed to create refund record");
  }

  // 6. Update item status to "cancelled"
  await db
    .update(applicationOrderItems)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(applicationOrderItems.id, params.itemId));

  // 7. Create fulfillment_log entry
  await db.insert(fulfillmentLogs).values({
    orderId: params.orderId,
    orderItemId: params.itemId,
    opsUserId: params.opsUserId,
    action: "refunded",
    fromStatus: item.status,
    toStatus: "cancelled",
    details: `Refund of $${refundAmount.toFixed(2)} - ${params.reason}${params.notes ? `: ${params.notes}` : ""}`,
    metadata: {
      refundId: refundRecord.id,
      stripeRefundId: stripeRefund.id,
      amount: refundAmount.toFixed(2),
    },
  });

  // 8. Check if order's total refunded equals grandTotal
  const [refundSumResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${refunds.amount}), '0')`,
    })
    .from(refunds)
    .where(
      and(
        eq(refunds.orderId, params.orderId),
        eq(refunds.status, "succeeded")
      )
    );

  const totalRefunded = parseFloat(refundSumResult?.total ?? "0");
  const grandTotal = parseFloat(order.grandTotal);

  if (totalRefunded >= grandTotal && grandTotal > 0) {
    await db
      .update(applicationOrders)
      .set({
        status: "refunded",
        updatedAt: new Date(),
      })
      .where(eq(applicationOrders.id, params.orderId));
  }

  return {
    refundId: refundRecord.id,
    amount: refundAmount.toFixed(2),
    stripeRefundId: stripeRefund.id,
  };
}
