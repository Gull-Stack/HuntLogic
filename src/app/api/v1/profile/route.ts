// =============================================================================
// Profile API — GET (full profile) and PATCH (update profile fields)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getProfile,
  updateProfile,
  inferPreferences,
} from "@/services/profile";

// =============================================================================
// GET /api/v1/profile — Complete hunter profile
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    const profile = await getProfile(userId);

    return NextResponse.json({
      data: profile,
      meta: {
        completeness: profile.completeness,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("User not found")) {
      return NextResponse.json(
        { error: "Not Found", message: error.message },
        { status: 404 }
      );
    }

    console.error("[profile] GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/v1/profile — Update profile fields
// =============================================================================

export async function PATCH(request: NextRequest) {
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

    // Validate that body contains known fields
    const allowedFields = [
      "displayName",
      "phone",
      "avatarUrl",
      "timezone",
      "onboardingStep",
      "onboardingComplete",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "No valid fields to update. Allowed: " + allowedFields.join(", "),
        },
        { status: 400 }
      );
    }

    const updatedProfile = await updateProfile(userId, updateData);

    // Trigger preference inference after profile update
    await inferPreferences(userId);

    return NextResponse.json({
      data: updatedProfile,
      meta: {
        completeness: updatedProfile.completeness,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("User not found")) {
      return NextResponse.json(
        { error: "Not Found", message: error.message },
        { status: 404 }
      );
    }

    console.error("[profile] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
