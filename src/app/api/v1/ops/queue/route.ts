// =============================================================================
// GET /api/v1/ops/queue — Ops fulfillment queue (FIFO)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray, asc, sql } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrderItems,
  applicationOrders,
  states,
  species,
  users,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/queue]";

export async function GET(request: NextRequest) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const stateCode = url.searchParams.get("stateCode");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10))
    );
    const offset = (page - 1) * limit;

    // Default statuses for the queue
    const statusFilter = statusParam
      ? [statusParam]
      : ["queued", "in_progress"];

    // Build conditions
    const conditions = [inArray(applicationOrderItems.status, statusFilter)];

    // If stateCode filter is provided, join states and filter by code
    if (stateCode) {
      conditions.push(eq(states.code, stateCode));
    }

    // Agent role: restrict to assigned states
    if (opsUser.role === "agent" && opsUser.assignedStates.length > 0) {
      conditions.push(inArray(states.code, opsUser.assignedStates));
    } else if (opsUser.role === "agent" && opsUser.assignedStates.length === 0) {
      // Agent with no assigned states sees nothing
      return NextResponse.json({
        data: { items: [], pagination: { page, limit, total: 0, totalPages: 0 } },
      });
    }

    const whereClause = and(...conditions);

    // Count total matching items
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
      .innerJoin(
        applicationOrders,
        eq(applicationOrderItems.orderId, applicationOrders.id)
      )
      .innerJoin(users, eq(applicationOrders.userId, users.id))
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Fetch queue items with joins
    const items = await db
      .select({
        id: applicationOrderItems.id,
        orderId: applicationOrderItems.orderId,
        userId: applicationOrderItems.userId,
        stateId: applicationOrderItems.stateId,
        speciesId: applicationOrderItems.speciesId,
        residency: applicationOrderItems.residency,
        huntType: applicationOrderItems.huntType,
        choiceRank: applicationOrderItems.choiceRank,
        stateFee: applicationOrderItems.stateFee,
        serviceFee: applicationOrderItems.serviceFee,
        status: applicationOrderItems.status,
        confirmationNumber: applicationOrderItems.confirmationNumber,
        errorMessage: applicationOrderItems.errorMessage,
        metadata: applicationOrderItems.metadata,
        createdAt: applicationOrderItems.createdAt,
        updatedAt: applicationOrderItems.updatedAt,
        // Order metadata
        orderStatus: applicationOrders.status,
        orderYear: applicationOrders.year,
        orderTier: applicationOrders.tier,
        orderGrandTotal: applicationOrders.grandTotal,
        orderCreatedAt: applicationOrders.createdAt,
        // State info
        stateCode: states.code,
        stateName: states.name,
        // Species info
        speciesSlug: species.slug,
        speciesName: species.commonName,
        // Customer info
        customerName: users.displayName,
        customerEmail: users.email,
      })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
      .innerJoin(
        applicationOrders,
        eq(applicationOrderItems.orderId, applicationOrders.id)
      )
      .innerJoin(users, eq(applicationOrders.userId, users.id))
      .where(whereClause)
      .orderBy(asc(applicationOrderItems.createdAt))
      .limit(limit)
      .offset(offset);

    console.log(
      `${LOG_PREFIX} GET: Returned ${items.length} queue items (page ${page}, total ${total}) for ops user ${opsUser.email}`
    );

    return NextResponse.json({
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}
