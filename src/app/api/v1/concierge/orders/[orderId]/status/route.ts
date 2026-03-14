// =============================================================================
// GET /api/v1/concierge/orders/[orderId]/status — Order status + fulfillment
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  fulfillmentLogs,
  states,
  species,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/orders/[orderId]/status]";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    // Fetch order and verify ownership
    const order = await db.query.applicationOrders.findFirst({
      where: and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, session.user.id)
      ),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch items with state/species joins
    const items = await db
      .select({
        id: applicationOrderItems.id,
        orderId: applicationOrderItems.orderId,
        stateId: applicationOrderItems.stateId,
        speciesId: applicationOrderItems.speciesId,
        huntUnitId: applicationOrderItems.huntUnitId,
        residency: applicationOrderItems.residency,
        huntType: applicationOrderItems.huntType,
        choiceRank: applicationOrderItems.choiceRank,
        stateFee: applicationOrderItems.stateFee,
        serviceFee: applicationOrderItems.serviceFee,
        status: applicationOrderItems.status,
        confirmationNumber: applicationOrderItems.confirmationNumber,
        submittedAt: applicationOrderItems.submittedAt,
        confirmedAt: applicationOrderItems.confirmedAt,
        errorMessage: applicationOrderItems.errorMessage,
        createdAt: applicationOrderItems.createdAt,
        stateCode: states.code,
        stateName: states.name,
        speciesSlug: species.slug,
        speciesName: species.commonName,
      })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
      .where(eq(applicationOrderItems.orderId, orderId));

    // Fetch fulfillment logs for this order
    const logs = await db
      .select()
      .from(fulfillmentLogs)
      .where(eq(fulfillmentLogs.orderId, orderId))
      .orderBy(desc(fulfillmentLogs.createdAt));

    return NextResponse.json({
      data: {
        order,
        items,
        fulfillmentLogs: logs,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch order status" },
      { status: 500 }
    );
  }
}
