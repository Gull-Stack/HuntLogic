// =============================================================================
// Onboarding API — GET (current progress)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getProgress } from "@/services/onboarding";

/**
 * Placeholder auth.
 */
function getUserIdFromRequest(request: NextRequest): string | null {
  const userIdHeader = request.headers.get("x-user-id");
  if (userIdHeader) return userIdHeader;
  const url = new URL(request.url);
  return url.searchParams.get("userId");
}

// =============================================================================
// GET /api/v1/onboarding — Current onboarding progress
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
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
