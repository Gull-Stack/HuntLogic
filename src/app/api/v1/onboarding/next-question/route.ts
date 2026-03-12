// =============================================================================
// Next Question API — GET (returns next adaptive question or null if ready)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getNextQuestion } from "@/services/onboarding";

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
// GET /api/v1/onboarding/next-question — Next adaptive question
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

    const question = await getNextQuestion(userId);

    if (!question) {
      return NextResponse.json({
        data: null,
        meta: {
          status: "playbook_ready",
          message:
            "Your profile has enough information to generate a personalized playbook.",
        },
      });
    }

    return NextResponse.json({
      data: question,
    });
  } catch (error) {
    console.error("[onboarding] next-question error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to generate next question",
      },
      { status: 500 }
    );
  }
}
