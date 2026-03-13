import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { huntGroups, huntGroupMembers, huntGroupPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await db.query.huntGroups.findFirst({
      where: eq(huntGroups.id, id),
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Verify membership
    const member = await db
      .select()
      .from(huntGroupMembers)
      .where(
        and(
          eq(huntGroupMembers.groupId, id),
          eq(huntGroupMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (member.length === 0 && group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const members = await db
      .select()
      .from(huntGroupMembers)
      .where(eq(huntGroupMembers.groupId, id));

    const plans = await db
      .select()
      .from(huntGroupPlans)
      .where(eq(huntGroupPlans.groupId, id));

    return NextResponse.json({
      ...group,
      members,
      plans,
      isOwner: group.ownerId === session.user.id,
    });
  } catch (error) {
    console.error("[api/groups/id] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
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

  try {
    const group = await db.query.huntGroups.findFirst({
      where: and(eq(huntGroups.id, id), eq(huntGroups.ownerId, session.user.id)),
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or not owner" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.targetYear !== undefined) updates.targetYear = body.targetYear;

    const [updated] = await db
      .update(huntGroups)
      .set(updates)
      .where(eq(huntGroups.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/groups/id] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await db.query.huntGroups.findFirst({
      where: and(eq(huntGroups.id, id), eq(huntGroups.ownerId, session.user.id)),
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or not owner" }, { status: 404 });
    }

    await db.delete(huntGroups).where(eq(huntGroups.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/groups/id] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
