// =============================================================================
// GET /api/v1/ops/agents — List ops users with current load
// =============================================================================

import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  opsUsers,
  applicationOrderItems,
  fulfillmentLogs,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/agents]";

export async function GET() {
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

  try {
    // Fetch all ops users
    const agents = await db
      .select({
        id: opsUsers.id,
        email: opsUsers.email,
        displayName: opsUsers.displayName,
        role: opsUsers.role,
        active: opsUsers.active,
        assignedStates: opsUsers.assignedStates,
        maxConcurrent: opsUsers.maxConcurrent,
        metadata: opsUsers.metadata,
        createdAt: opsUsers.createdAt,
        updatedAt: opsUsers.updatedAt,
      })
      .from(opsUsers);

    // For each agent, compute currentLoad:
    // Count of items with status 'in_progress' where the most recent
    // fulfillment_log 'assigned' action points to this agent.
    const agentsWithLoad = await Promise.all(
      agents.map(async (agent) => {
        // Find items currently in_progress that have an "assigned" log
        // entry most recently pointing to this agent.
        // We use a subquery: items where status = 'in_progress' AND
        // the latest 'assigned' fulfillment log for that item has
        // opsUserId = this agent's id.
        const [loadResult] = await db
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
              ) = ${agent.id}`
            )
          );

        return {
          ...agent,
          currentLoad: loadResult?.count ?? 0,
        };
      })
    );

    console.log(
      `${LOG_PREFIX} GET: Returned ${agentsWithLoad.length} agents for ops user ${opsUser.email}`
    );

    return NextResponse.json({ data: { agents: agentsWithLoad } });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
