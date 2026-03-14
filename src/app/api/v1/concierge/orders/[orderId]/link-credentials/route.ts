// =============================================================================
// POST /api/v1/concierge/orders/[orderId]/link-credentials
// Auto-links user's saved credentials to order items by matching stateCode
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  stateCredentials,
  states,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/orders/[orderId]/link-credentials]";

export async function POST(
  _request: NextRequest,
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
        { error: "Credentials can only be linked to draft orders" },
        { status: 400 }
      );
    }

    // Fetch all items for this order with their state codes
    const items = await db
      .select({
        itemId: applicationOrderItems.id,
        stateId: applicationOrderItems.stateId,
        credentialId: applicationOrderItems.credentialId,
        stateCode: states.code,
      })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .where(eq(applicationOrderItems.orderId, orderId));

    // Fetch user's credentials
    const userCreds = await db
      .select({
        id: stateCredentials.id,
        stateCode: stateCredentials.stateCode,
        status: stateCredentials.status,
      })
      .from(stateCredentials)
      .where(eq(stateCredentials.userId, session.user.id));

    // Build a map of stateCode -> credentialId for active credentials
    const credMap = new Map<string, string>();
    for (const cred of userCreds) {
      if (cred.status === "active") {
        credMap.set(cred.stateCode, cred.id);
      }
    }

    // Link credentials to items by matching stateCode
    let linkedCount = 0;

    for (const item of items) {
      const credId = credMap.get(item.stateCode);
      if (credId && credId !== item.credentialId) {
        await db
          .update(applicationOrderItems)
          .set({
            credentialId: credId,
            updatedAt: new Date(),
          })
          .where(eq(applicationOrderItems.id, item.itemId));
        linkedCount++;
      }
    }

    console.log(
      `${LOG_PREFIX} POST: Linked ${linkedCount} credential(s) to order ${orderId}`
    );

    // Return updated items
    const updatedItems = await db
      .select({
        id: applicationOrderItems.id,
        stateCode: states.code,
        stateName: states.name,
        credentialId: applicationOrderItems.credentialId,
      })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .where(eq(applicationOrderItems.orderId, orderId));

    return NextResponse.json({
      data: {
        linkedCount,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to link credentials" },
      { status: 500 }
    );
  }
}
