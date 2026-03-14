// =============================================================================
// POST /api/v1/ops/orders/[orderId]/assign — Assign order to agent
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  fulfillmentLogs,
  opsUsers,
  states,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/orders/[orderId]/assign]";

/**
 * Compute current load for an agent: count of in_progress items
 * where the most recent 'assigned' fulfillment log points to them.
 */
async function getAgentLoad(agentId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applicationOrderItems)
    .where(
      and(
        eq(applicationOrderItems.status, "in_progress"),
        sql`(
          SELECT ${fulfillmentLogs.opsUserId}
          FROM ${fulfillmentLogs}
          WHERE ${fulfillmentLogs.orderItemId} = ${applicationOrderItems.id}
            AND ${fulfillmentLogs.action} = 'assigned'
          ORDER BY ${fulfillmentLogs.createdAt} DESC
          LIMIT 1
        ) = ${agentId}`
      )
    );
  return result?.count ?? 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
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

  const { orderId } = await params;

  try {
    const body = await request.json();
    const { agentId, auto } = body;

    // Validate order exists
    const order = await db.query.applicationOrders.findFirst({
      where: eq(applicationOrders.id, orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get order items with their state codes for matching
    const orderItems = await db
      .select({
        id: applicationOrderItems.id,
        stateId: applicationOrderItems.stateId,
        stateCode: states.code,
      })
      .from(applicationOrderItems)
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .where(eq(applicationOrderItems.orderId, orderId));

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order has no items" },
        { status: 400 }
      );
    }

    const orderStateCodes = [...new Set(orderItems.map((i) => i.stateCode))];

    let assignedAgent: {
      id: string;
      email: string;
      displayName: string;
      currentLoad: number;
      maxConcurrent: number;
    };

    if (auto) {
      // Auto-assign: find best agent
      // Criteria: active, has assigned states matching order items' states,
      // lowest load below maxConcurrent
      const allAgents = await db
        .select()
        .from(opsUsers)
        .where(eq(opsUsers.active, true));

      // Filter agents who cover at least one of the order's states
      const candidateAgents = allAgents.filter((agent) => {
        const agentStates = (agent.assignedStates as string[]) || [];
        return orderStateCodes.some((code) => agentStates.includes(code));
      });

      if (candidateAgents.length === 0) {
        return NextResponse.json(
          { error: "No available agent found for the order's states" },
          { status: 404 }
        );
      }

      // Compute load for each candidate and find the one with lowest load
      // that is still below maxConcurrent
      let bestAgent: typeof candidateAgents[0] | null = null;
      let bestLoad = Infinity;

      for (const candidate of candidateAgents) {
        const load = await getAgentLoad(candidate.id);
        if (load < candidate.maxConcurrent && load < bestLoad) {
          bestAgent = candidate;
          bestLoad = load;
        }
      }

      if (!bestAgent) {
        return NextResponse.json(
          { error: "No agent available with capacity" },
          { status: 404 }
        );
      }

      assignedAgent = {
        id: bestAgent.id,
        email: bestAgent.email,
        displayName: bestAgent.displayName,
        currentLoad: bestLoad,
        maxConcurrent: bestAgent.maxConcurrent,
      };
    } else {
      // Manual assign
      if (!agentId) {
        return NextResponse.json(
          { error: "agentId is required for manual assignment" },
          { status: 400 }
        );
      }

      const agent = await db.query.opsUsers.findFirst({
        where: eq(opsUsers.id, agentId),
      });

      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        );
      }

      if (!agent.active) {
        return NextResponse.json(
          { error: "Agent is not active" },
          { status: 400 }
        );
      }

      const currentLoad = await getAgentLoad(agent.id);

      if (currentLoad >= agent.maxConcurrent) {
        return NextResponse.json(
          {
            error: `Agent at capacity (${currentLoad}/${agent.maxConcurrent})`,
          },
          { status: 400 }
        );
      }

      assignedAgent = {
        id: agent.id,
        email: agent.email,
        displayName: agent.displayName,
        currentLoad,
        maxConcurrent: agent.maxConcurrent,
      };
    }

    // Create fulfillment log entries for assignment (one per item)
    const logEntries = orderItems.map((item) => ({
      orderId,
      orderItemId: item.id,
      opsUserId: assignedAgent.id,
      action: "assigned" as const,
      fromStatus: null,
      toStatus: null,
      details: `Assigned to ${assignedAgent.displayName} (${assignedAgent.email})`,
      metadata: {},
    }));

    await db.insert(fulfillmentLogs).values(logEntries);

    console.log(
      `${LOG_PREFIX} POST: Order ${orderId} assigned to agent ${assignedAgent.email} (${auto ? "auto" : "manual"}) by ${opsUser.email}`
    );

    return NextResponse.json({
      data: {
        assignment: {
          orderId,
          agentId: assignedAgent.id,
          agentEmail: assignedAgent.email,
          agentName: assignedAgent.displayName,
          currentLoad: assignedAgent.currentLoad,
          maxConcurrent: assignedAgent.maxConcurrent,
          itemCount: orderItems.length,
          method: auto ? "auto" : "manual",
        },
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to assign order" },
      { status: 500 }
    );
  }
}
