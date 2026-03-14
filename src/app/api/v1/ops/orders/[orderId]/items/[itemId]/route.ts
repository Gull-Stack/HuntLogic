// =============================================================================
// PUT /api/v1/ops/orders/[orderId]/items/[itemId] — Update item status
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrderItems,
  applicationOrders,
  fulfillmentLogs,
  states,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/orders/[orderId]/items/[itemId]]";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ["in_progress", "failed"],
  in_progress: ["submitted", "failed"],
  submitted: ["confirmed", "failed"],
  confirmed: ["drawn", "unsuccessful", "failed"],
};

// Terminal statuses
const TERMINAL_STATUSES = ["confirmed", "drawn", "unsuccessful", "failed", "cancelled"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, itemId } = await params;

  try {
    const body = await request.json();
    const { status, confirmationNumber, errorMessage, metadata } = body;

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    // Fetch the item
    const item = await db.query.applicationOrderItems.findFirst({
      where: and(
        eq(applicationOrderItems.id, itemId),
        eq(applicationOrderItems.orderId, orderId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      );
    }

    // Agent role: validate item's state is in their assignedStates
    if (opsUser.role === "agent") {
      const [stateRow] = await db
        .select({ code: states.code })
        .from(states)
        .where(eq(states.id, item.stateId));

      if (
        stateRow &&
        !opsUser.assignedStates.includes(stateRow.code)
      ) {
        return NextResponse.json(
          { error: "You are not assigned to this state" },
          { status: 403 }
        );
      }
    }

    // Validate status transition
    const currentStatus = item.status;

    if (status === "failed") {
      // Any status can transition to failed, but requires errorMessage
      if (!errorMessage) {
        return NextResponse.json(
          { error: "errorMessage is required when setting status to failed" },
          { status: 400 }
        );
      }
    } else {
      // Check valid transitions
      const allowed = VALID_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition: ${currentStatus} → ${status}. Allowed: ${
              allowed ? allowed.join(", ") : "none (terminal state)"
            }`,
          },
          { status: 400 }
        );
      }
    }

    // Build update fields
    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (confirmationNumber !== undefined) {
      updates.confirmationNumber = confirmationNumber;
    }
    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage;
    }
    if (metadata !== undefined) {
      updates.metadata = metadata;
    }
    if (status === "submitted") {
      updates.submittedAt = new Date();
    }
    if (status === "confirmed") {
      updates.confirmedAt = new Date();
    }

    // Update the item
    const [updatedItem] = await db
      .update(applicationOrderItems)
      .set(updates)
      .where(eq(applicationOrderItems.id, itemId))
      .returning();

    // Create fulfillment log entry
    await db.insert(fulfillmentLogs).values({
      orderId,
      orderItemId: itemId,
      opsUserId: opsUser.opsUserId,
      action: status === "failed" ? "failed" : "started",
      fromStatus: currentStatus,
      toStatus: status,
      details:
        status === "failed"
          ? errorMessage
          : `Status changed from ${currentStatus} to ${status}`,
      metadata: {},
    });

    // Check if all items have reached terminal states — if so, complete the order
    const allItems = await db
      .select({ status: applicationOrderItems.status })
      .from(applicationOrderItems)
      .where(eq(applicationOrderItems.orderId, orderId));

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
        .where(eq(applicationOrders.id, orderId));

      console.log(
        `${LOG_PREFIX} PUT: All items terminal — order ${orderId} marked completed`
      );
    }

    console.log(
      `${LOG_PREFIX} PUT: Item ${itemId} status changed ${currentStatus} → ${status} by ${opsUser.email}`
    );

    return NextResponse.json({ data: { item: updatedItem } });
  } catch (error) {
    console.error(`${LOG_PREFIX} PUT error:`, error);
    return NextResponse.json(
      { error: "Failed to update item status" },
      { status: 500 }
    );
  }
}
