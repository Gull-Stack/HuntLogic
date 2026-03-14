import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  fulfillmentLogs,
  opsUsers,
  states,
  species,
  users,
} from "@/lib/db/schema";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";
import {
  notifyApplicationSubmitted,
  notifyDrawResult,
} from "@/services/notifications";
import type {
  OpsSession,
  QueueItem,
  QueueFilters,
  OpsOrderDetail,
  StatusTransition,
  AssignmentResult,
} from "./types";

// ========================
// Status transition state machine
// ========================

const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ["in_progress"],
  in_progress: ["submitted", "failed"],
  submitted: ["confirmed", "failed"],
  confirmed: ["drawn", "unsuccessful"],
};

/** Terminal statuses that indicate an item is fully resolved. */
const TERMINAL_STATUSES = ["confirmed", "drawn", "unsuccessful", "failed", "cancelled"];

/**
 * Check whether a status transition is legal.
 * Any status can transition to "failed" (always valid).
 */
function isValidTransition(from: string, to: string): boolean {
  if (to === "failed") return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

// ========================
// Queue retrieval
// ========================

/**
 * Fetch paginated queue items with status in ('queued', 'in_progress').
 * Joins orders/states/species/users for display.
 * If the ops user has role "agent", filters by their assigned states.
 */
export async function getQueueItems(
  filters: QueueFilters,
  opsUser: OpsSession
): Promise<{ items: QueueItem[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 25;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions: ReturnType<typeof eq>[] = [];

  // Default: show queued and in_progress items
  if (filters.status) {
    conditions.push(eq(applicationOrderItems.status, filters.status));
  } else {
    conditions.push(
      or(
        eq(applicationOrderItems.status, "queued"),
        eq(applicationOrderItems.status, "in_progress")
      )!
    );
  }

  // Filter by state code if provided
  if (filters.stateCode) {
    conditions.push(eq(states.code, filters.stateCode));
  }

  // Agent role: restrict to assigned states
  if (opsUser.role === "agent" && opsUser.assignedStates.length > 0) {
    conditions.push(inArray(states.code, opsUser.assignedStates));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Count total matching items
  const [countResult] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(applicationOrderItems)
    .innerJoin(applicationOrders, eq(applicationOrderItems.orderId, applicationOrders.id))
    .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
    .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
    .innerJoin(users, eq(applicationOrders.userId, users.id))
    .where(whereClause);

  const total = countResult?.total ?? 0;

  // Fetch paginated items
  const rows = await db
    .select({
      itemId: applicationOrderItems.id,
      orderId: applicationOrderItems.orderId,
      orderMetadata: applicationOrders.metadata,
      customerName: users.displayName,
      customerEmail: users.email,
      stateCode: states.code,
      stateName: states.name,
      speciesSlug: species.slug,
      speciesName: species.commonName,
      residency: applicationOrderItems.residency,
      huntType: applicationOrderItems.huntType,
      choiceRank: applicationOrderItems.choiceRank,
      stateFee: applicationOrderItems.stateFee,
      serviceFee: applicationOrderItems.serviceFee,
      status: applicationOrderItems.status,
      createdAt: applicationOrderItems.createdAt,
    })
    .from(applicationOrderItems)
    .innerJoin(applicationOrders, eq(applicationOrderItems.orderId, applicationOrders.id))
    .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
    .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
    .innerJoin(users, eq(applicationOrders.userId, users.id))
    .where(whereClause)
    .orderBy(desc(applicationOrderItems.createdAt))
    .limit(limit)
    .offset(offset);

  // Look up assigned agents for each item from fulfillment_logs
  const itemIds = rows.map((r) => r.itemId);
  let agentMap: Record<string, string> = {};

  if (itemIds.length > 0) {
    // Get the most recent "assigned" log per item
    const assignLogs = await db
      .select({
        orderItemId: fulfillmentLogs.orderItemId,
        agentName: opsUsers.displayName,
      })
      .from(fulfillmentLogs)
      .innerJoin(opsUsers, eq(fulfillmentLogs.opsUserId, opsUsers.id))
      .where(
        and(
          inArray(fulfillmentLogs.orderItemId, itemIds),
          eq(fulfillmentLogs.action, "assigned")
        )
      )
      .orderBy(desc(fulfillmentLogs.createdAt));

    // Keep the first (most recent) assignment per item
    for (const log of assignLogs) {
      if (log.orderItemId && !agentMap[log.orderItemId]) {
        agentMap[log.orderItemId] = log.agentName;
      }
    }
  }

  const items: QueueItem[] = rows.map((row) => {
    const meta = row.orderMetadata as Record<string, unknown>;
    return {
      itemId: row.itemId,
      orderId: row.orderId,
      orderNumber: (meta?.orderNumber as string) ?? row.orderId,
      customerName: row.customerName ?? "",
      customerEmail: row.customerEmail,
      stateCode: row.stateCode,
      stateName: row.stateName,
      speciesSlug: row.speciesSlug,
      speciesName: row.speciesName,
      residency: row.residency,
      huntType: row.huntType,
      choiceRank: row.choiceRank,
      stateFee: row.stateFee,
      serviceFee: row.serviceFee,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      assignedAgent: agentMap[row.itemId] ?? null,
    };
  });

  return { items, total };
}

// ========================
// Status transitions
// ========================

/**
 * Transition an order item to a new status.
 * Validates the transition is legal, updates the item, creates a fulfillment log,
 * and manages order-level status changes.
 */
export async function transitionItemStatus(
  params: StatusTransition
): Promise<void> {
  // Validate the transition
  if (!isValidTransition(params.fromStatus, params.toStatus)) {
    throw new Error(
      `Invalid status transition: "${params.fromStatus}" -> "${params.toStatus}"`
    );
  }

  // Verify the item exists and has the expected current status
  const [item] = await db
    .select()
    .from(applicationOrderItems)
    .where(
      and(
        eq(applicationOrderItems.id, params.itemId),
        eq(applicationOrderItems.orderId, params.orderId)
      )
    )
    .limit(1);

  if (!item) {
    throw new Error("Order item not found");
  }

  if (item.status !== params.fromStatus) {
    throw new Error(
      `Item status mismatch: expected "${params.fromStatus}", found "${item.status}"`
    );
  }

  // Build the update payload
  const updateData: Record<string, unknown> = {
    status: params.toStatus,
    updatedAt: new Date(),
  };

  if (params.toStatus === "submitted") {
    updateData.submittedAt = new Date();
  }

  if (params.toStatus === "confirmed") {
    updateData.confirmedAt = new Date();
  }

  if (params.confirmationNumber) {
    updateData.confirmationNumber = params.confirmationNumber;
  }

  if (params.errorMessage) {
    updateData.errorMessage = params.errorMessage;
  }

  // Update the item status
  await db
    .update(applicationOrderItems)
    .set(updateData)
    .where(eq(applicationOrderItems.id, params.itemId));

  // Create fulfillment log entry
  await db.insert(fulfillmentLogs).values({
    orderId: params.orderId,
    orderItemId: params.itemId,
    opsUserId: params.opsUserId,
    action: params.toStatus,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    details: params.errorMessage ?? params.confirmationNumber ?? null,
    metadata: params.metadata ?? {},
  });

  // If transitioning to in_progress, update order status to in_progress
  if (params.toStatus === "in_progress") {
    await db
      .update(applicationOrders)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(applicationOrders.id, params.orderId));
  }

  // Check if ALL items in the order are terminal
  const allItems = await db
    .select({ status: applicationOrderItems.status })
    .from(applicationOrderItems)
    .where(eq(applicationOrderItems.orderId, params.orderId));

  const allTerminal = allItems.every((i) =>
    TERMINAL_STATUSES.includes(i.status)
  );

  if (allTerminal && allItems.length > 0) {
    await db
      .update(applicationOrders)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(applicationOrders.id, params.orderId));
  }

  // -----------------------------------------------------------------------
  // Send concierge notifications on key status transitions
  // -----------------------------------------------------------------------

  if (
    params.toStatus === "submitted" ||
    params.toStatus === "drawn" ||
    params.toStatus === "unsuccessful"
  ) {
    // Look up the order owner and state/species names for the notification
    const [orderWithContext] = await db
      .select({
        userId: applicationOrders.userId,
        stateName: states.name,
        speciesName: species.commonName,
      })
      .from(applicationOrderItems)
      .innerJoin(
        applicationOrders,
        eq(applicationOrderItems.orderId, applicationOrders.id)
      )
      .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
      .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
      .where(eq(applicationOrderItems.id, params.itemId))
      .limit(1);

    if (orderWithContext) {
      if (params.toStatus === "submitted") {
        notifyApplicationSubmitted(
          orderWithContext.userId,
          params.orderId,
          orderWithContext.stateName,
          orderWithContext.speciesName
        ).catch((err) => {
          console.error(
            `[fulfillment] Failed to send application_submitted notification for item ${params.itemId}:`,
            err
          );
        });
      }

      if (
        params.toStatus === "drawn" ||
        params.toStatus === "unsuccessful"
      ) {
        notifyDrawResult(
          orderWithContext.userId,
          params.orderId,
          orderWithContext.stateName,
          orderWithContext.speciesName,
          params.toStatus as "drawn" | "unsuccessful"
        ).catch((err) => {
          console.error(
            `[fulfillment] Failed to send draw_result notification for item ${params.itemId}:`,
            err
          );
        });
      }
    }
  }
}

// ========================
// Order detail for ops
// ========================

/**
 * Get full order detail including items, payments, refunds, fulfillment logs,
 * and customer info. Does not enforce user ownership (ops access).
 */
export async function getOpsOrderDetail(
  orderId: string
): Promise<OpsOrderDetail> {
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(eq(applicationOrders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found");
  }

  // Items with state/species joins
  const items = await db
    .select({
      item: applicationOrderItems,
      stateName: states.name,
      stateCode: states.code,
      speciesName: species.commonName,
      speciesSlug: species.slug,
    })
    .from(applicationOrderItems)
    .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
    .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
    .where(eq(applicationOrderItems.orderId, orderId));

  // Payments
  const { payments } = await import("@/lib/db/schema");
  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId));

  // Refunds
  const { refunds } = await import("@/lib/db/schema");
  const refundRows = await db
    .select()
    .from(refunds)
    .where(eq(refunds.orderId, orderId));

  // Fulfillment logs
  const logs = await db
    .select()
    .from(fulfillmentLogs)
    .where(eq(fulfillmentLogs.orderId, orderId))
    .orderBy(desc(fulfillmentLogs.createdAt));

  // Customer info
  const [customer] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      tier: users.tier,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, order.userId))
    .limit(1);

  if (!customer) {
    throw new Error("Customer not found for order");
  }

  return {
    order,
    items: items.map((row) => ({
      ...row.item,
      stateName: row.stateName,
      stateCode: row.stateCode,
      speciesName: row.speciesName,
      speciesSlug: row.speciesSlug,
    })),
    payments: paymentRows,
    refunds: refundRows,
    fulfillmentLogs: logs,
    customer,
  };
}

// ========================
// Order assignment
// ========================

/**
 * Assign an order to a specific ops agent.
 * Validates the agent exists, is active, and has capacity.
 */
export async function assignOrder(
  orderId: string,
  agentId: string,
  assignedBy: string
): Promise<AssignmentResult> {
  // Validate the order exists
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(eq(applicationOrders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error("Order not found");
  }

  // Validate the agent exists and is active
  const [agent] = await db
    .select()
    .from(opsUsers)
    .where(eq(opsUsers.id, agentId))
    .limit(1);

  if (!agent) {
    throw new Error("Agent not found");
  }

  if (!agent.active) {
    throw new Error("Agent is inactive and cannot be assigned orders");
  }

  // Check agent capacity
  const currentLoad = await getAgentCurrentLoad(agentId);
  if (currentLoad >= agent.maxConcurrent) {
    throw new Error(
      `Agent "${agent.displayName}" is at capacity (${currentLoad}/${agent.maxConcurrent})`
    );
  }

  const assignedAt = new Date();

  // Create fulfillment log with action "assigned"
  await db.insert(fulfillmentLogs).values({
    orderId,
    opsUserId: agentId,
    action: "assigned",
    details: `Assigned by ${assignedBy}`,
    metadata: { assignedBy },
  });

  return {
    orderId,
    agentId: agent.id,
    agentName: agent.displayName,
    assignedAt,
  };
}

/**
 * Auto-assign an order to the best available agent.
 * Picks the active agent who handles the order's states and has the lowest current load.
 * Returns null if no suitable agent is available.
 */
export async function autoAssignOrder(
  orderId: string
): Promise<AssignmentResult | null> {
  // Get the state codes for all items in this order
  const orderItems = await db
    .select({
      stateCode: states.code,
    })
    .from(applicationOrderItems)
    .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
    .where(eq(applicationOrderItems.orderId, orderId));

  if (orderItems.length === 0) {
    throw new Error("Order has no items");
  }

  const requiredStates = [...new Set(orderItems.map((i) => i.stateCode))];

  // Get all active agents
  const agents = await db
    .select()
    .from(opsUsers)
    .where(and(eq(opsUsers.active, true), eq(opsUsers.role, "agent")));

  // Filter to agents whose assigned states cover all required states
  const eligibleAgents: Array<{
    agent: typeof agents[0];
    load: number;
  }> = [];

  for (const agent of agents) {
    const agentStates = agent.assignedStates as string[];
    const coversAll = requiredStates.every((s) => agentStates.includes(s));
    if (!coversAll) continue;

    const load = await getAgentCurrentLoad(agent.id);
    if (load >= agent.maxConcurrent) continue;

    eligibleAgents.push({ agent, load });
  }

  if (eligibleAgents.length === 0) {
    return null;
  }

  // Pick the agent with the lowest load
  eligibleAgents.sort((a, b) => a.load - b.load);
  const best = eligibleAgents[0]!;

  const assignedAt = new Date();

  // Create fulfillment log
  await db.insert(fulfillmentLogs).values({
    orderId,
    opsUserId: best.agent.id,
    action: "assigned",
    details: "Auto-assigned based on state coverage and load balancing",
    metadata: { autoAssigned: true },
  });

  return {
    orderId,
    agentId: best.agent.id,
    agentName: best.agent.displayName,
    assignedAt,
  };
}

// ========================
// Fulfillment log
// ========================

/**
 * Add a fulfillment log entry.
 */
export async function addFulfillmentLog(params: {
  orderId: string;
  orderItemId?: string;
  opsUserId?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  details?: string;
  screenshotUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(fulfillmentLogs).values({
    orderId: params.orderId,
    orderItemId: params.orderItemId ?? null,
    opsUserId: params.opsUserId ?? null,
    action: params.action,
    fromStatus: params.fromStatus ?? null,
    toStatus: params.toStatus ?? null,
    details: params.details ?? null,
    screenshotUrl: params.screenshotUrl ?? null,
    metadata: params.metadata ?? {},
  });
}

// ========================
// Internal helpers
// ========================

/**
 * Get the current load for an agent: count of in_progress items
 * where the agent is the most recently assigned via fulfillment_logs.
 */
async function getAgentCurrentLoad(agentId: string): Promise<number> {
  // Find all orders currently assigned to this agent (most recent "assigned" log)
  // by finding in_progress items where this agent has the latest assignment
  const result = await db.execute<{ load: number }>(sql`
    SELECT count(DISTINCT aoi.id)::int AS load
    FROM application_order_items aoi
    INNER JOIN fulfillment_logs fl ON fl.order_id = aoi.order_id
    WHERE aoi.status = 'in_progress'
      AND fl.action = 'assigned'
      AND fl.ops_user_id = ${agentId}
      AND fl.created_at = (
        SELECT max(fl2.created_at)
        FROM fulfillment_logs fl2
        WHERE fl2.order_id = aoi.order_id
          AND fl2.action = 'assigned'
      )
  `);

  const rows = result as unknown as Array<{ load: number }>;
  return rows[0]?.load ?? 0;
}
