// =============================================================================
// POST /api/v1/ops/orders/[orderId]/items/[itemId]/log — Add fulfillment log
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrderItems,
  fulfillmentLogs,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/orders/[orderId]/items/[itemId]/log]";

const VALID_ACTIONS = [
  "note_added",
  "form_filled",
  "screenshot_taken",
  "escalated",
  "retried",
] as const;

export async function POST(
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
    const { action, details, screenshotUrl, metadata } = body;

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        {
          error: `Invalid action: ${action}. Valid actions: ${VALID_ACTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate item exists and belongs to the order
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

    // Insert log entry (does NOT change item status)
    const [logEntry] = await db
      .insert(fulfillmentLogs)
      .values({
        orderId,
        orderItemId: itemId,
        opsUserId: opsUser.opsUserId,
        action,
        fromStatus: item.status,
        toStatus: item.status, // status unchanged
        details: details ?? null,
        screenshotUrl: screenshotUrl ?? null,
        metadata: metadata ?? {},
      })
      .returning();

    console.log(
      `${LOG_PREFIX} POST: Log entry ${logEntry.id} (action=${action}) added to item ${itemId} by ${opsUser.email}`
    );

    return NextResponse.json({ data: { log: logEntry } }, { status: 201 });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to add log entry" },
      { status: 500 }
    );
  }
}
