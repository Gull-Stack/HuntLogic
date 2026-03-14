// =============================================================================
// GET /api/v1/concierge/orders/[orderId] — Fetch order with items
// PUT /api/v1/concierge/orders/[orderId] — Update draft order
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  states,
  species,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/orders/[orderId]]";

// =============================================================================
// GET — Fetch order with items and state/species joins
// =============================================================================

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
    const order = await db.query.applicationOrders.findFirst({
      where: eq(applicationOrders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Enforce user ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch items with state/species joins
    const items = await db
      .select({
        id: applicationOrderItems.id,
        orderId: applicationOrderItems.orderId,
        userId: applicationOrderItems.userId,
        stateId: applicationOrderItems.stateId,
        speciesId: applicationOrderItems.speciesId,
        huntUnitId: applicationOrderItems.huntUnitId,
        recommendationId: applicationOrderItems.recommendationId,
        credentialId: applicationOrderItems.credentialId,
        residency: applicationOrderItems.residency,
        huntType: applicationOrderItems.huntType,
        choiceRank: applicationOrderItems.choiceRank,
        stateFee: applicationOrderItems.stateFee,
        serviceFee: applicationOrderItems.serviceFee,
        status: applicationOrderItems.status,
        confirmationNumber: applicationOrderItems.confirmationNumber,
        formData: applicationOrderItems.formData,
        submittedAt: applicationOrderItems.submittedAt,
        confirmedAt: applicationOrderItems.confirmedAt,
        errorMessage: applicationOrderItems.errorMessage,
        metadata: applicationOrderItems.metadata,
        createdAt: applicationOrderItems.createdAt,
        updatedAt: applicationOrderItems.updatedAt,
        stateCode: states.code,
        stateName: states.name,
        speciesSlug: species.slug,
        speciesName: species.commonName,
      })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
      .where(eq(applicationOrderItems.orderId, orderId));

    return NextResponse.json({
      data: {
        order,
        items,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT — Update draft order (notes, groupId)
// =============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
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
        { error: "Only draft orders can be updated" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.groupId !== undefined) updates.groupId = body.groupId;

    const [updated] = await db
      .update(applicationOrders)
      .set(updates)
      .where(eq(applicationOrders.id, orderId))
      .returning();

    console.log(`${LOG_PREFIX} PUT: Updated order ${orderId}`);

    return NextResponse.json({ data: { order: updated } });
  } catch (error) {
    console.error(`${LOG_PREFIX} PUT error:`, error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
