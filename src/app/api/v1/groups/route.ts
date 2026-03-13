import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { huntGroups, huntGroupMembers } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get groups where user is owner or active member
    const memberRows = await db
      .select({ groupId: huntGroupMembers.groupId })
      .from(huntGroupMembers)
      .where(
        and(
          eq(huntGroupMembers.userId, session.user.id),
          eq(huntGroupMembers.status, "active")
        )
      );

    const memberGroupIds = memberRows.map((r) => r.groupId);

    const groups = await db
      .select({
        id: huntGroups.id,
        name: huntGroups.name,
        description: huntGroups.description,
        targetYear: huntGroups.targetYear,
        ownerId: huntGroups.ownerId,
        createdAt: huntGroups.createdAt,
      })
      .from(huntGroups)
      .where(
        memberGroupIds.length > 0
          ? or(
              eq(huntGroups.ownerId, session.user.id),
              ...memberGroupIds.map((id) => eq(huntGroups.id, id))
            )
          : eq(huntGroups.ownerId, session.user.id)
      );

    // Enrich with member counts
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const members = await db
          .select({ id: huntGroupMembers.id, status: huntGroupMembers.status })
          .from(huntGroupMembers)
          .where(eq(huntGroupMembers.groupId, g.id));

        return {
          ...g,
          memberCount: members.filter((m) => m.status === "active").length,
          pendingCount: members.filter((m) => m.status === "invited").length,
          isOwner: g.ownerId === session.user!.id,
        };
      })
    );

    return NextResponse.json({ groups: enriched });
  } catch (error) {
    console.error("[api/groups] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, targetYear } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create group
    const [group] = await db
      .insert(huntGroups)
      .values({
        name,
        description,
        targetYear,
        ownerId: session.user.id,
      })
      .returning();

    // Get user email
    const user = await db.query.users.findFirst({
      where: eq((await import("@/lib/db/schema")).users.id, session.user.id),
      columns: { email: true },
    });

    // Add creator as owner member
    await db.insert(huntGroupMembers).values({
      groupId: group.id,
      userId: session.user.id,
      email: user?.email ?? "",
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("[api/groups] POST error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
