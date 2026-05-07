import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recommendations, states, species } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateTripPlan } from "@/services/travel/trip-planner";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recommendationId = request.nextUrl.searchParams.get("recommendationId");

  try {
    // Try to get home state from preferences
    const { hunterPreferences } = await import("@/lib/db/schema");
    const homeStatePref = await db.query.hunterPreferences.findFirst({
      where: and(
        eq(hunterPreferences.userId, session.user.id),
        eq(hunterPreferences.category, "travel"),
        eq(hunterPreferences.key, "home_state")
      ),
    });

    const homeState =
      (homeStatePref?.value as string) ?? "CO"; // default to CO

    if (recommendationId) {
      // Generate trip plan from a recommendation
      const rows = await db
        .select({
          stateCode: states.code,
          speciesSlug: species.slug,
          costEstimate: recommendations.costEstimate,
        })
        .from(recommendations)
        .innerJoin(states, eq(recommendations.stateId, states.id))
        .innerJoin(species, eq(recommendations.speciesId, species.id))
        .where(
          and(
            eq(recommendations.id, recommendationId),
            eq(recommendations.userId, session.user.id)
          )
        )
        .limit(1);

      const rec = rows[0];
      if (!rec) {
        return NextResponse.json(
          { error: "Recommendation not found" },
          { status: 404 }
        );
      }

      const costData = rec.costEstimate as Record<string, number> | null;

      const plan = await generateTripPlan({
        homeState,
        huntState: rec.stateCode,
        tagCost: costData?.total ? Math.round(costData.total) : undefined,
      });

      return NextResponse.json(plan);
    }

    // Generic trip plan for a state
    const huntState = request.nextUrl.searchParams.get("state") ?? "CO";
    const plan = await generateTripPlan({ homeState, huntState });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[api/travel] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate trip plan" },
      { status: 500 }
    );
  }
}
