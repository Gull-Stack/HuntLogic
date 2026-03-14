// =============================================================================
// GET /api/v1/ops/metrics — Dashboard metrics
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, sql } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  applicationOrderItems,
  fulfillmentLogs,
  payments,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/metrics]";

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "today";

    const now = new Date();
    const todayStart = getStartOfDay(now);

    // queuedCount: items with status 'queued'
    const [queuedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationOrderItems)
      .where(eq(applicationOrderItems.status, "queued"));

    // inProgressCount: items with status 'in_progress'
    const [inProgressResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationOrderItems)
      .where(eq(applicationOrderItems.status, "in_progress"));

    // completedToday: items that reached 'confirmed' status today
    // Check fulfillment_logs for toStatus = 'confirmed' with createdAt >= today
    const [completedTodayResult] = await db
      .select({ count: sql<number>`count(DISTINCT ${fulfillmentLogs.orderItemId})::int` })
      .from(fulfillmentLogs)
      .where(
        and(
          eq(fulfillmentLogs.toStatus, "confirmed"),
          gte(fulfillmentLogs.createdAt, todayStart)
        )
      );

    // failedCount: items with status 'failed'
    const [failedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationOrderItems)
      .where(eq(applicationOrderItems.status, "failed"));

    // revenueToday: sum of payments.amount where paidAt >= today start
    const [revenueTodayResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "succeeded"),
          gte(payments.paidAt, todayStart)
        )
      );

    // revenueThisWeek: sum of payments.amount where paidAt >= 7 days ago
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [revenueWeekResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "succeeded"),
          gte(payments.paidAt, sevenDaysAgo)
        )
      );

    const metrics = {
      queuedCount: queuedResult?.count ?? 0,
      inProgressCount: inProgressResult?.count ?? 0,
      completedToday: completedTodayResult?.count ?? 0,
      failedCount: failedResult?.count ?? 0,
      revenueToday: parseFloat(revenueTodayResult?.total ?? "0"),
      revenueThisWeek: parseFloat(revenueWeekResult?.total ?? "0"),
      range,
      generatedAt: now.toISOString(),
    };

    console.log(
      `${LOG_PREFIX} GET: Metrics generated (range=${range}) by ${opsUser.email}`
    );

    return NextResponse.json({ data: { metrics } });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
