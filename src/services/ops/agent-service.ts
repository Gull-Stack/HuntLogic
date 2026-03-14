import { db } from "@/lib/db";
import { opsUsers } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { AgentWithLoad } from "./types";

// ========================
// Agent listing
// ========================

/**
 * List all ops users with their computed current load.
 * Current load = count of in_progress items where the agent
 * is the most recently assigned via fulfillment_logs.
 */
export async function listAgentsWithLoad(): Promise<AgentWithLoad[]> {
  const agents = await db.select().from(opsUsers);

  const result: AgentWithLoad[] = [];

  for (const agent of agents) {
    const currentLoad = await computeAgentLoad(agent.id);

    result.push({
      id: agent.id,
      email: agent.email,
      displayName: agent.displayName,
      role: agent.role,
      active: agent.active,
      assignedStates: agent.assignedStates as string[],
      maxConcurrent: agent.maxConcurrent,
      currentLoad,
    });
  }

  return result;
}

// ========================
// Single agent retrieval
// ========================

/**
 * Get a single agent by ID with computed current load.
 */
export async function getAgentById(
  agentId: string
): Promise<AgentWithLoad> {
  const [agent] = await db
    .select()
    .from(opsUsers)
    .where(eq(opsUsers.id, agentId))
    .limit(1);

  if (!agent) {
    throw new Error("Agent not found");
  }

  const currentLoad = await computeAgentLoad(agent.id);

  return {
    id: agent.id,
    email: agent.email,
    displayName: agent.displayName,
    role: agent.role,
    active: agent.active,
    assignedStates: agent.assignedStates as string[],
    maxConcurrent: agent.maxConcurrent,
    currentLoad,
  };
}

// ========================
// Agent updates
// ========================

/**
 * Update an ops agent's mutable fields: assignedStates, maxConcurrent, active, role.
 */
export async function updateAgent(
  agentId: string,
  updates: {
    assignedStates?: string[];
    maxConcurrent?: number;
    active?: boolean;
    role?: string;
  }
): Promise<AgentWithLoad> {
  // Verify agent exists
  const [existing] = await db
    .select()
    .from(opsUsers)
    .where(eq(opsUsers.id, agentId))
    .limit(1);

  if (!existing) {
    throw new Error("Agent not found");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.assignedStates !== undefined) {
    updateData.assignedStates = updates.assignedStates;
  }

  if (updates.maxConcurrent !== undefined) {
    if (updates.maxConcurrent < 1) {
      throw new Error("maxConcurrent must be at least 1");
    }
    updateData.maxConcurrent = updates.maxConcurrent;
  }

  if (updates.active !== undefined) {
    updateData.active = updates.active;
  }

  if (updates.role !== undefined) {
    const validRoles = ["admin", "supervisor", "agent"];
    if (!validRoles.includes(updates.role)) {
      throw new Error(`Invalid role "${updates.role}". Must be one of: ${validRoles.join(", ")}`);
    }
    updateData.role = updates.role;
  }

  const [updated] = await db
    .update(opsUsers)
    .set(updateData)
    .where(eq(opsUsers.id, agentId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update agent");
  }

  const currentLoad = await computeAgentLoad(updated.id);

  return {
    id: updated.id,
    email: updated.email,
    displayName: updated.displayName,
    role: updated.role,
    active: updated.active,
    assignedStates: updated.assignedStates as string[],
    maxConcurrent: updated.maxConcurrent,
    currentLoad,
  };
}

// ========================
// Internal helpers
// ========================

/**
 * Compute the current load for an agent.
 * Counts in_progress items where the agent has the most recent "assigned" log
 * for that item's order.
 */
async function computeAgentLoad(agentId: string): Promise<number> {
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
