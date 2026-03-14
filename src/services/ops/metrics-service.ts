import { db } from "@/lib/db";
import {
  applicationOrderItems,
  fulfillmentLogs,
  payments,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { OpsMetrics } from "./types";

// ========================
// Metrics computation
// ========================

/**
 * Compute ops dashboard metrics for a given date range.
 * Defaults to today if no range is specified.
 */
export async function getOpsMetrics(range?: {
  from?: Date;
  to?: Date;
}): Promise<OpsMetrics> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Start of the current week (Monday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);

  const rangeFrom = range?.from ?? startOfToday;
  const rangeTo = range?.to ?? endOfToday;

  // Count items by current status
  const statusCounts = await db
    .select({
      status: applicationOrderItems.status,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationOrderItems)
    .groupBy(applicationOrderItems.status);

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) {
    statusMap[row.status] = row.count;
  }

  const queuedCount = statusMap["queued"] ?? 0;
  const inProgressCount = statusMap["in_progress"] ?? 0;
  const failedCount = statusMap["failed"] ?? 0;

  // Count items that transitioned to "confirmed" within the date range
  // by looking at fulfillment_logs
  const [completedResult] = await db
    .select({
      count: sql<number>`count(DISTINCT ${fulfillmentLogs.orderItemId})::int`,
    })
    .from(fulfillmentLogs)
    .where(
      and(
        eq(fulfillmentLogs.toStatus, "confirmed"),
        gte(fulfillmentLogs.createdAt, rangeFrom),
        lte(fulfillmentLogs.createdAt, rangeTo)
      )
    );

  const completedToday = completedResult?.count ?? 0;

  // Revenue today: sum of payments.amount where paidAt is today
  const [revenueTodayResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${payments.amount}), '0')`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "succeeded"),
        gte(payments.paidAt, startOfToday),
        lte(payments.paidAt, endOfToday)
      )
    );

  const revenueToday = parseFloat(revenueTodayResult?.total ?? "0");

  // Revenue this week: sum of payments.amount where paidAt is this week
  const [revenueWeekResult] = await db
    .select({
      total: sql<string>`coalesce(sum(${payments.amount}), '0')`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "succeeded"),
        gte(payments.paidAt, startOfWeek),
        lte(payments.paidAt, endOfToday)
      )
    );

  const revenueThisWeek = parseFloat(revenueWeekResult?.total ?? "0");

  return {
    queuedCount,
    inProgressCount,
    completedToday,
    failedCount,
    revenueToday,
    revenueThisWeek,
  };
}
