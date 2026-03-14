// =============================================================================
// Answer API — POST (submit answer, returns result with new completeness)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processAnswer } from "@/services/onboarding";
import type { OnboardingAnswer } from "@/services/onboarding";

// =============================================================================
// POST /api/v1/onboarding/answer — Submit answer to current question
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.questionId) {
      return NextResponse.json(
        { error: "Bad Request", message: "questionId is required" },
        { status: 400 }
      );
    }

    if (!body.responseType) {
      return NextResponse.json(
        { error: "Bad Request", message: "responseType is required" },
        { status: 400 }
      );
    }

    // Validate that at least one response value is provided
    const hasSelectedValues =
      body.selectedValues &&
      Array.isArray(body.selectedValues) &&
      body.selectedValues.length > 0;
    const hasFreeText = body.freeText && typeof body.freeText === "string";
    const hasStructured =
      body.structured && typeof body.structured === "object";

    if (!hasSelectedValues && !hasFreeText && !hasStructured) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "At least one of selectedValues, freeText, or structured must be provided",
        },
        { status: 400 }
      );
    }

    const answer: OnboardingAnswer = {
      questionId: body.questionId,
      responseType: body.responseType,
      selectedValues: body.selectedValues,
      freeText: body.freeText,
      structured: body.structured,
    };

    const result = await processAnswer(userId, body.questionId, answer);

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

    console.error("[onboarding] answer error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to process answer",
      },
      { status: 500 }
    );
  }
}
