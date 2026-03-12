import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userActions } from "@/lib/db/schema/actions";
import { getServerUser, AuthError } from "@/lib/auth/get-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const offset = (page - 1) * limit;

    const conditions = [eq(userActions.userId, user.userId)];
    if (status) conditions.push(eq(userActions.status, status));
    if (priority) conditions.push(eq(userActions.priority, priority));

    const priorityOrder = sql`CASE ${userActions.priority}
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END`;

    const [actions, countResult] = await Promise.all([
      db
        .select()
        .from(userActions)
        .where(and(...conditions))
        .orderBy(priorityOrder, asc(userActions.dueDate), desc(userActions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userActions)
        .where(and(...conditions)),
    ]);

    return NextResponse.json({
      actions,
      total: countResult[0]?.count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[actions] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    const body = await request.json();
    const { actionId, status } = body as { actionId?: string; status?: string };

    if (!actionId || !status) {
      return NextResponse.json(
        { error: "actionId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "in_progress", "completed", "skipped", "missed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existing = await db.query.userActions.findFirst({
      where: and(eq(userActions.id, actionId), eq(userActions.userId, user.userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    await db.update(userActions).set(updateData).where(eq(userActions.id, actionId));

    return NextResponse.json({ success: true, actionId, status });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[actions] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
