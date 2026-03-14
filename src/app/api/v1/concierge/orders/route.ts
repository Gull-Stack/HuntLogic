// =============================================================================
// GET /api/v1/concierge/orders — List application orders for user
// POST /api/v1/concierge/orders — Create a new draft order
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationOrders, users } from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/orders]";

// =============================================================================
// GET — List orders
// =============================================================================

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const yearParam = searchParams.get("year");

    // Build conditions
    const conditions = [eq(applicationOrders.userId, session.user.id)];

    if (status) {
      conditions.push(eq(applicationOrders.status, status));
    }

    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (!isNaN(year)) {
        conditions.push(eq(applicationOrders.year, year));
      }
    }

    const orders = await db
      .select()
      .from(applicationOrders)
      .where(and(...conditions))
      .orderBy(desc(applicationOrders.createdAt));

    return NextResponse.json({ data: { orders } });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST — Create draft order
// =============================================================================

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { year, groupId } = body;

    if (!year) {
      return NextResponse.json(
        { error: "year is required" },
        { status: 400 }
      );
    }

    // Look up user tier
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { tier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [order] = await db
      .insert(applicationOrders)
      .values({
        userId: session.user.id,
        year,
        tier: user.tier,
        status: "draft",
        groupId: groupId ?? null,
      })
      .returning();

    console.log(`${LOG_PREFIX} POST: Created draft order ${order.id} for user ${session.user.id}`);

    return NextResponse.json({ data: { order } }, { status: 201 });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
