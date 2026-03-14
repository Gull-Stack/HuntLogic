import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { huntGroups, huntGroupMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { config } from "@/lib/config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const group = await db.query.huntGroups.findFirst({
      where: and(eq(huntGroups.id, id), eq(huntGroups.ownerId, session.user.id)),
    });

    if (!group) {
      return NextResponse.json({ error: "Not group owner" }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if already a member
    const existing = await db
      .select()
      .from(huntGroupMembers)
      .where(
        and(
          eq(huntGroupMembers.groupId, id),
          eq(huntGroupMembers.email, email)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Already invited" }, { status: 409 });
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });

    // Create member
    const [member] = await db
      .insert(huntGroupMembers)
      .values({
        groupId: id,
        userId: existingUser?.id ?? null,
        email,
        role: "member",
        status: existingUser ? "active" : "invited",
        joinedAt: existingUser ? new Date() : null,
      })
      .returning();

    // Send invite email via Resend
    const ownerUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { displayName: true, email: true },
    });

    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);

        await resend.emails.send({
          from: config.auth.emailFrom,
          to: email,
          subject: `${ownerUser?.displayName ?? "A hunter"} invited you to plan a hunt on ${config.app.brandName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, ${config.app.brandColor}, #2A5C40); padding: 24px; border-radius: 12px 12px 0 0;">
                <h2 style="color: #F5F5F0; margin: 0; font-size: 18px;">${config.app.brandName}</h2>
              </div>
              <div style="background: #ffffff; padding: 24px; border: 1px solid #E0DDD5; border-top: none; border-radius: 0 0 12px 12px;">
                <h3 style="color: #2D1F0E; margin: 0 0 12px 0;">You've been invited to a hunt group!</h3>
                <p style="color: #6B7B6E; line-height: 1.6; margin: 0 0 8px 0;">
                  <strong>${ownerUser?.displayName ?? "A hunter"}</strong> wants you to join <strong>"${group.name}"</strong>${group.targetYear ? ` for ${group.targetYear}` : ""}.
                </p>
                <p style="color: #6B7B6E; line-height: 1.6; margin: 0 0 20px 0;">
                  Plan hunts together, compare draw odds, and coordinate logistics — all in one place.
                </p>
                <a href="${config.app.url}/groups" style="display: inline-block; background: linear-gradient(135deg, ${config.app.brandAccent}, ${config.app.brandAccentSecondary}); color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join the Group</a>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.warn("[groups/members] Email send failed:", emailErr);
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("[api/groups/members] POST error:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
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

  try {
    const group = await db.query.huntGroups.findFirst({
      where: and(eq(huntGroups.id, id), eq(huntGroups.ownerId, session.user.id)),
    });

    if (!group) {
      return NextResponse.json({ error: "Not group owner" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId } = body;

    // Can't remove self
    const member = await db
      .select()
      .from(huntGroupMembers)
      .where(eq(huntGroupMembers.id, memberId))
      .limit(1);

    if (member.length > 0 && member[0].userId === session.user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await db.delete(huntGroupMembers).where(eq(huntGroupMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/groups/members] DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
