// =============================================================================
// POST /api/v1/onboarding/complete — Mark onboarding as done
// =============================================================================

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    await db
      .update(users)
      .set({
        onboardingComplete: true,
        onboardingStep: "complete",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`[onboarding] Marked complete for user ${userId}`);

    return NextResponse.json({ data: { onboardingComplete: true } });
  } catch (error) {
    console.error("[onboarding] complete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to mark onboarding complete" },
      { status: 500 }
    );
  }
}
