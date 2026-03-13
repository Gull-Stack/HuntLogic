import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { huntGroups, huntGroupMembers, huntGroupPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function verifyMembership(groupId: string, userId: string): Promise<boolean> {
  const group = await db.query.huntGroups.findFirst({
    where: eq(huntGroups.id, groupId),
  });
  if (!group) return false;
  if (group.ownerId === userId) return true;

  const member = await db
    .select()
    .from(huntGroupMembers)
    .where(
      and(
        eq(huntGroupMembers.groupId, groupId),
        eq(huntGroupMembers.userId, userId),
        eq(huntGroupMembers.status, "active")
      )
    )
    .limit(1);

  return member.length > 0;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await verifyMembership(id, session.user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  try {
    const plans = await db
      .select()
      .from(huntGroupPlans)
      .where(eq(huntGroupPlans.groupId, id));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("[api/groups/plans] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await verifyMembership(id, session.user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { stateCode, speciesSlug, unitCode, year, notes } = body;

    if (!stateCode || !speciesSlug || !year) {
      return NextResponse.json(
        { error: "stateCode, speciesSlug, and year are required" },
        { status: 400 }
      );
    }

    const [plan] = await db
      .insert(huntGroupPlans)
      .values({
        groupId: id,
        stateCode,
        speciesSlug,
        unitCode,
        year,
        notes,
      })
      .returning();

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("[api/groups/plans] POST error:", error);
    return NextResponse.json({ error: "Failed to add plan" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await verifyMembership(id, session.user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { planId, status } = body;

    const [updated] = await db
      .update(huntGroupPlans)
      .set({ status })
      .where(
        and(
          eq(huntGroupPlans.id, planId),
          eq(huntGroupPlans.groupId, id)
        )
      )
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/groups/plans] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!(await verifyMembership(id, session.user.id))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { planId } = body;

    await db
      .delete(huntGroupPlans)
      .where(
        and(
          eq(huntGroupPlans.id, planId),
          eq(huntGroupPlans.groupId, id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/groups/plans] DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove plan" }, { status: 500 });
  }
}
