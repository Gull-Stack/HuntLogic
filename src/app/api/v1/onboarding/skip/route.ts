// =============================================================================
// Skip API — POST (skip current question, returns next question)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { skipQuestion } from "@/services/onboarding";

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
// POST /api/v1/onboarding/skip — Skip the current question
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.questionId) {
      return NextResponse.json(
        { error: "Bad Request", message: "questionId is required" },
        { status: 400 }
      );
    }

    const result = await skipQuestion(userId, body.questionId);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Unknown question ID")
    ) {
      return NextResponse.json(
        { error: "Bad Request", message: error.message },
        { status: 400 }
      );
    }

    console.error("[onboarding] skip error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to skip question",
      },
      { status: 500 }
    );
  }
}
