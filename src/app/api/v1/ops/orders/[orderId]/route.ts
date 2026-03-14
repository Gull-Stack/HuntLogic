// =============================================================================
// GET /api/v1/ops/orders/[orderId] — Full order detail (ops view)
// =============================================================================

import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  payments,
  refunds,
  fulfillmentLogs,
  opsUsers,
  states,
  species,
  users,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/orders/[orderId]]";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    // Fetch order
    const order = await db.query.applicationOrders.findFirst({
      where: eq(applicationOrders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch customer profile
    const customer = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        tier: users.tier,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, order.userId));

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

    // Fetch payments
    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));

    // Fetch refunds
    const orderRefunds = await db
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, orderId));

    // Fetch fulfillment logs with ops user display names
    const logs = await db
      .select({
        id: fulfillmentLogs.id,
        orderId: fulfillmentLogs.orderId,
        orderItemId: fulfillmentLogs.orderItemId,
        opsUserId: fulfillmentLogs.opsUserId,
        action: fulfillmentLogs.action,
        fromStatus: fulfillmentLogs.fromStatus,
        toStatus: fulfillmentLogs.toStatus,
        details: fulfillmentLogs.details,
        screenshotUrl: fulfillmentLogs.screenshotUrl,
        metadata: fulfillmentLogs.metadata,
        createdAt: fulfillmentLogs.createdAt,
        opsUserName: opsUsers.displayName,
        opsUserEmail: opsUsers.email,
      })
      .from(fulfillmentLogs)
      .leftJoin(opsUsers, eq(fulfillmentLogs.opsUserId, opsUsers.id))
      .where(eq(fulfillmentLogs.orderId, orderId))
      .orderBy(asc(fulfillmentLogs.createdAt));

    console.log(
      `${LOG_PREFIX} GET: Order ${orderId} detail fetched by ops user ${opsUser.email}`
    );

    return NextResponse.json({
      data: {
        order,
        customer: customer[0] ?? null,
        items,
        payments: orderPayments,
        refunds: orderRefunds,
        fulfillmentLogs: logs,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}
