// =============================================================================
// POST /api/v1/concierge/orders/[orderId]/items — Add item to order
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  stateFeeSchedules,
  serviceFeeConfig,
  users,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/orders/[orderId]/items]";

// Map user subscription tiers to service fee tiers
const TIER_MAP: Record<string, string> = {
  scout: "default",
  pro: "hunter",
  elite: "outfitter",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

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
        { error: "Items can only be added to draft orders" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      stateId,
      speciesId,
      residency,
      huntType,
      choiceRank,
      huntUnitId,
      recommendationId,
      credentialId,
      formData,
    } = body;

    if (!stateId || !speciesId || !residency) {
      return NextResponse.json(
        { error: "stateId, speciesId, and residency are required" },
        { status: 400 }
      );
    }

    // Look up state fees for this state/species/year/residency
    const fees = await db
      .select()
      .from(stateFeeSchedules)
      .where(
        and(
          eq(stateFeeSchedules.stateId, stateId),
          eq(stateFeeSchedules.speciesId, speciesId),
          eq(stateFeeSchedules.year, order.year),
          eq(stateFeeSchedules.residency, residency)
        )
      );

    const stateFeeAmount = fees.reduce(
      (sum, fee) => sum + parseFloat(fee.amount),
      0
    );

    // Look up service fee for the user's tier
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { tier: true },
    });

    const feeTier = TIER_MAP[user?.tier ?? "scout"] ?? "default";

    const serviceFeesResult = await db
      .select()
      .from(serviceFeeConfig)
      .where(
        and(
          eq(serviceFeeConfig.tier, feeTier),
          eq(serviceFeeConfig.feeType, "per_application"),
          eq(serviceFeeConfig.active, true)
        )
      );

    const serviceFeeAmount = serviceFeesResult.length > 0
      ? parseFloat(serviceFeesResult[0].amount)
      : 0;

    // Insert order item
    const [item] = await db
      .insert(applicationOrderItems)
      .values({
        orderId,
        userId: session.user.id,
        stateId,
        speciesId,
        residency,
        huntType: huntType ?? null,
        choiceRank: choiceRank ?? 1,
        huntUnitId: huntUnitId ?? null,
        recommendationId: recommendationId ?? null,
        credentialId: credentialId ?? null,
        stateFee: stateFeeAmount.toFixed(2),
        serviceFee: serviceFeeAmount.toFixed(2),
        formData: formData ?? {},
      })
      .returning();

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

    console.log(
      `${LOG_PREFIX} POST: Added item ${item.id} to order ${orderId} (stateFee=${stateFeeAmount}, serviceFee=${serviceFeeAmount})`
    );

    return NextResponse.json({ data: { item } }, { status: 201 });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to add item to order" },
      { status: 500 }
    );
  }
}
