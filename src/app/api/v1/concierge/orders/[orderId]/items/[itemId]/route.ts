// =============================================================================
// DELETE /api/v1/concierge/orders/[orderId]/items/[itemId] — Remove item
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationOrders, applicationOrderItems } from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/orders/[orderId]/items/[itemId]]";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, itemId } = await params;

  try {
    // Validate order exists, is owned by user, and is draft
    const order = await db.query.applicationOrders.findFirst({
      where: and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, session.user.id)
      ),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "draft") {
      return NextResponse.json(
        { error: "Items can only be removed from draft orders" },
        { status: 400 }
      );
    }

    // Verify the item belongs to this order
    const item = await db.query.applicationOrderItems.findFirst({
      where: and(
        eq(applicationOrderItems.id, itemId),
        eq(applicationOrderItems.orderId, orderId)
      ),
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete the item
    await db
      .delete(applicationOrderItems)
      .where(eq(applicationOrderItems.id, itemId));

    // Recalculate order totals
    const allItems = await db
      .select({
        totalStateFees: sql<string>`COALESCE(SUM(${applicationOrderItems.stateFee}::numeric), 0)`,
        totalServiceFees: sql<string>`COALESCE(SUM(${applicationOrderItems.serviceFee}::numeric), 0)`,
      })
      .from(applicationOrderItems)
      .where(eq(applicationOrderItems.orderId, orderId));

    const totalStateFees = parseFloat(allItems[0].totalStateFees);
    const totalServiceFees = parseFloat(allItems[0].totalServiceFees);
    const grandTotal = totalStateFees + totalServiceFees;

    await db
      .update(applicationOrders)
      .set({
        stateFeeTotal: totalStateFees.toFixed(2),
        serviceFeeTotal: totalServiceFees.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(applicationOrders.id, orderId));

    console.log(`${LOG_PREFIX} DELETE: Removed item ${itemId} from order ${orderId}`);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error(`${LOG_PREFIX} DELETE error:`, error);
    return NextResponse.json(
      { error: "Failed to remove item from order" },
      { status: 500 }
    );
  }
}
