// =============================================================================
// Onboarding API — GET (current progress)
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProgress } from "@/services/onboarding";

// =============================================================================
// GET /api/v1/onboarding — Current onboarding progress
// =============================================================================

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    const progress = await getProgress(userId);

    return NextResponse.json({
      data: progress,
    });
  } catch (error) {
    console.error("[onboarding] GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get onboarding progress" },
      { status: 500 }
    );
  }
}
