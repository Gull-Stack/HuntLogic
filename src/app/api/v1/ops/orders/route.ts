// =============================================================================
// GET /api/v1/ops/orders — List application orders (ops view)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  users,
  states,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/orders]";

export async function GET(request: NextRequest) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const stateCode = url.searchParams.get("stateCode");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10))
    );
    const offset = (page - 1) * limit;

    // Build filter conditions for orders
    const conditions: ReturnType<typeof eq>[] = [];

    if (status) {
      conditions.push(eq(applicationOrders.status, status));
    }

    if (dateFrom) {
      conditions.push(gte(applicationOrders.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      // Include the entire dateTo day
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(applicationOrders.createdAt, endDate));
    }

    // If stateCode filter: find orders that have at least one item in that state
    let orderIdsInState: string[] | null = null;
    if (stateCode) {
      const stateRows = await db
        .select({ id: states.id })
        .from(states)
        .where(eq(states.code, stateCode));

      if (stateRows.length === 0) {
        return NextResponse.json({
          data: {
            orders: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          },
        });
      }

      const stateId = stateRows[0].id;
      const itemRows = await db
        .selectDistinct({ orderId: applicationOrderItems.orderId })
        .from(applicationOrderItems)
        .where(eq(applicationOrderItems.stateId, stateId));

      orderIdsInState = itemRows.map((r) => r.orderId);
      if (orderIdsInState.length === 0) {
        return NextResponse.json({
          data: {
            orders: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          },
        });
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total orders
    let countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationOrders)
      .innerJoin(users, eq(applicationOrders.userId, users.id));

    if (whereClause) {
      // Drizzle's where() narrows the chain type so the prior variable can no
      // longer hold the post-where shape. Cast keeps the chain typed loosely.
      countQuery = countQuery.where(whereClause) as typeof countQuery;
    }

    // We handle orderIdsInState separately via a raw SQL filter
    let totalCount: number;
    if (orderIdsInState) {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(applicationOrders)
        .innerJoin(users, eq(applicationOrders.userId, users.id))
        .where(
          whereClause
            ? and(
                whereClause,
                sql`${applicationOrders.id} = ANY(${orderIdsInState})`
              )
            : sql`${applicationOrders.id} = ANY(${orderIdsInState})`
        );
      totalCount = countResult?.count ?? 0;
    } else {
      const [countResult] = whereClause
        ? await db
            .select({ count: sql<number>`count(*)::int` })
            .from(applicationOrders)
            .innerJoin(users, eq(applicationOrders.userId, users.id))
            .where(whereClause)
        : await db
            .select({ count: sql<number>`count(*)::int` })
            .from(applicationOrders)
            .innerJoin(users, eq(applicationOrders.userId, users.id));
      totalCount = countResult?.count ?? 0;
    }

    // Fetch orders with customer info
    const finalWhere = orderIdsInState
      ? whereClause
        ? and(
            whereClause,
            sql`${applicationOrders.id} = ANY(${orderIdsInState})`
          )
        : sql`${applicationOrders.id} = ANY(${orderIdsInState})`
      : whereClause;

    const baseQuery = db
      .select({
        id: applicationOrders.id,
        userId: applicationOrders.userId,
        groupId: applicationOrders.groupId,
        year: applicationOrders.year,
        tier: applicationOrders.tier,
        status: applicationOrders.status,
        stateFeeTotal: applicationOrders.stateFeeTotal,
        serviceFeeTotal: applicationOrders.serviceFeeTotal,
        grandTotal: applicationOrders.grandTotal,
        stripePaymentIntentId: applicationOrders.stripePaymentIntentId,
        notes: applicationOrders.notes,
        submittedAt: applicationOrders.submittedAt,
        completedAt: applicationOrders.completedAt,
        metadata: applicationOrders.metadata,
        createdAt: applicationOrders.createdAt,
        updatedAt: applicationOrders.updatedAt,
        customerName: users.displayName,
        customerEmail: users.email,
        customerTier: users.tier,
      })
      .from(applicationOrders)
      .innerJoin(users, eq(applicationOrders.userId, users.id));

    const orders = finalWhere
      ? await baseQuery
          .where(finalWhere)
          .orderBy(desc(applicationOrders.createdAt))
          .limit(limit)
          .offset(offset)
      : await baseQuery
          .orderBy(desc(applicationOrders.createdAt))
          .limit(limit)
          .offset(offset);

    // Get item counts for each order
    const orderIds = orders.map((o) => o.id);
    let itemCounts: Record<string, number> = {};

    if (orderIds.length > 0) {
      const counts = await db
        .select({
          orderId: applicationOrderItems.orderId,
          count: sql<number>`count(*)::int`,
        })
        .from(applicationOrderItems)
        .where(sql`${applicationOrderItems.orderId} = ANY(${orderIds})`)
        .groupBy(applicationOrderItems.orderId);

      itemCounts = Object.fromEntries(
        counts.map((c) => [c.orderId, c.count])
      );
    }

    const ordersWithCounts = orders.map((order) => ({
      ...order,
      itemCount: itemCounts[order.id] ?? 0,
    }));

    console.log(
      `${LOG_PREFIX} GET: Returned ${orders.length} orders (page ${page}, total ${totalCount}) for ops user ${opsUser.email}`
    );

    return NextResponse.json({
      data: {
        orders: ordersWithCounts,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
