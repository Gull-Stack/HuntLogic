// =============================================================================
// Preferences API — GET (list) and PUT (bulk update)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPreferences,
  setPreferences,
  getProfileCompleteness,
  inferPreferences,
} from "@/services/profile";
import type { PreferenceInput, PreferenceCategory } from "@/services/profile";

// =============================================================================
// GET /api/v1/profile/preferences — List all preferences
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

    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get("category") as PreferenceCategory | null;

    let preferences = await getPreferences(userId);

    // Filter by category if provided
    if (categoryFilter) {
      preferences = preferences.filter((p) => p.category === categoryFilter);
    }

    const completeness = await getProfileCompleteness(userId);

    return NextResponse.json({
      data: preferences,
      meta: {
        count: preferences.length,
        completeness,
      },
    });
  } catch (error) {
    console.error("[preferences] GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/v1/profile/preferences — Bulk update preferences
// =============================================================================

export async function PUT(request: NextRequest) {
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

    if (!body.preferences || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Request body must include a 'preferences' array",
        },
        { status: 400 }
      );
    }

    // Validate each preference
    const validCategories = new Set([
      "species_interest",
      "hunt_orientation",
      "timeline",
      "budget",
      "travel",
      "hunt_style",
      "weapon",
      "physical",
      "location",
      "experience",
      "land_access",
    ]);

    const preferences: PreferenceInput[] = [];

    for (const pref of body.preferences) {
      if (!pref.category || !pref.key || pref.value === undefined) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message:
              "Each preference must have category, key, and value. Got: " +
              JSON.stringify(pref),
          },
          { status: 400 }
        );
      }

      if (!validCategories.has(pref.category)) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: `Invalid category: ${pref.category}. Valid: ${[...validCategories].join(", ")}`,
          },
          { status: 400 }
        );
      }

      preferences.push({
        category: pref.category as PreferenceCategory,
        key: pref.key,
        value: pref.value,
        confidence: pref.confidence ?? 1.0,
        source: pref.source ?? "user",
      });
    }

    await setPreferences(userId, preferences);

    // Trigger inference after preferences update
    await inferPreferences(userId);

    const completeness = await getProfileCompleteness(userId);
    const allPrefs = await getPreferences(userId);

    return NextResponse.json({
      data: allPrefs,
      meta: {
        updated: preferences.length,
        completeness,
      },
    });
  } catch (error) {
    console.error("[preferences] PUT error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
