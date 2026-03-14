// =============================================================================
// POST /api/v1/ops/orders/[orderId]/items/[itemId]/refund — Initiate refund
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrderItems,
  applicationOrders,
  payments,
  refunds,
  fulfillmentLogs,
} from "@/lib/db/schema";
import { createRefund } from "@/services/stripe";

const LOG_PREFIX = "[api:ops/orders/[orderId]/items/[itemId]/refund]";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role check: supervisor/admin only
  if (opsUser.role === "agent") {
    return NextResponse.json(
      { error: "Forbidden: supervisor or admin role required" },
      { status: 403 }
    );
  }

  const { orderId, itemId } = await params;

  try {
    const body = await request.json();
    const { reason, notes } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      );
    }

    // Validate item exists and belongs to the order
    const item = await db.query.applicationOrderItems.findFirst({
      where: and(
        eq(applicationOrderItems.id, itemId),
        eq(applicationOrderItems.orderId, orderId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      );
    }

    // Validate order exists
    const order = await db.query.applicationOrders.findFirst({
      where: eq(applicationOrders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the payment for this order
    const payment = await db.query.payments.findFirst({
      where: and(
        eq(payments.orderId, orderId),
        eq(payments.status, "succeeded")
      ),
    });

    if (!payment) {
      return NextResponse.json(
        { error: "No successful payment found for this order" },
        { status: 400 }
      );
    }

    // Calculate refund amount: item's stateFee + serviceFee
    const stateFeeAmount = parseFloat(item.stateFee ?? "0");
    const serviceFeeAmount = parseFloat(item.serviceFee ?? "0");
    const refundAmount = stateFeeAmount + serviceFeeAmount;

    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: "Refund amount must be greater than zero" },
        { status: 400 }
      );
    }

    // Convert to cents for Stripe
    const refundAmountCents = Math.round(refundAmount * 100);

    // Call Stripe to create the refund
    const stripeRefund = await createRefund({
      paymentIntentId: payment.stripePaymentIntentId,
      amount: refundAmountCents,
      reason: "requested_by_customer",
      metadata: {
        orderId,
        orderItemId: itemId,
        opsUserId: opsUser.opsUserId,
        reason,
      },
    });

    // Insert refund record
    const [refundRecord] = await db
      .insert(refunds)
      .values({
        paymentId: payment.id,
        orderId,
        orderItemId: itemId,
        stripeRefundId: stripeRefund.id,
        amount: refundAmount.toFixed(2),
        reason,
        status: stripeRefund.status === "succeeded" ? "succeeded" : "processing",
        notes: notes ?? null,
        initiatedBy: "ops",
        processedAt:
          stripeRefund.status === "succeeded" ? new Date() : null,
        metadata: {
          stripeRefundStatus: stripeRefund.status,
          opsUserEmail: opsUser.email,
        },
      })
      .returning();

    // Update item status to 'cancelled'
    const previousStatus = item.status;
    await db
      .update(applicationOrderItems)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(applicationOrderItems.id, itemId));

    // Create fulfillment log entry
    await db.insert(fulfillmentLogs).values({
      orderId,
      orderItemId: itemId,
      opsUserId: opsUser.opsUserId,
      action: "failed",
      fromStatus: previousStatus,
      toStatus: "cancelled",
      details: `Refund initiated: $${refundAmount.toFixed(2)} — reason: ${reason}${notes ? ` — notes: ${notes}` : ""}`,
      metadata: {
        refundId: refundRecord.id,
        stripeRefundId: stripeRefund.id,
        refundAmount,
      },
    });

    console.log(
      `${LOG_PREFIX} POST: Refund $${refundAmount.toFixed(2)} initiated for item ${itemId} on order ${orderId} by ${opsUser.email}`
    );

    return NextResponse.json({
      data: {
        refund: refundRecord,
        refundAmount,
        stripeRefundId: stripeRefund.id,
        stripeRefundStatus: stripeRefund.status,
      },
    }, { status: 201 });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
