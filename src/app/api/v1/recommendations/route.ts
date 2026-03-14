// =============================================================================
// GET /api/v1/recommendations — List recommendations for user
// POST /api/v1/recommendations — Submit feedback on a recommendation
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  recommendations,
  playbooks,
  states,
  species,
} from "@/lib/db/schema";
import { processRecommendationFeedback } from "@/services/intelligence/feedback-engine";

const LOG_PREFIX = "[api:recommendations]";

// =============================================================================
// GET — List recommendations
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Query params
    const recType = searchParams.get("type"); // apply_now, build_points, otc_opportunity, watch
    const orientation = searchParams.get("orientation"); // trophy, opportunity, balanced, meat, experience
    const stateFilter = searchParams.get("state"); // state code e.g. CO
    const speciesFilter = searchParams.get("species"); // species slug e.g. elk
    const timeline = searchParams.get("timeline"); // this_year, 1-3_years, 3-5_years, 5+_years
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));
    const offset = (page - 1) * limit;

    console.log(
      `${LOG_PREFIX} GET: userId=${userId} type=${recType} state=${stateFilter} page=${page}`
    );

    // Find active playbook for this user
    const activePlaybook = await db.query.playbooks.findFirst({
      where: and(eq(playbooks.userId, userId), eq(playbooks.status, "active")),
    });

    if (!activePlaybook) {
      return NextResponse.json({
        recommendations: [],
        total: 0,
        page,
        limit,
        message: "No active playbook found. Generate a playbook first.",
      });
    }

    // Build query — fetch recommendations with joined state/species info
    let query = db
      .select({
        id: recommendations.id,
        playbookId: recommendations.playbookId,
        stateId: recommendations.stateId,
        speciesId: recommendations.speciesId,
        huntUnitId: recommendations.huntUnitId,
        recType: recommendations.recType,
        orientation: recommendations.orientation,
        rank: recommendations.rank,
        score: recommendations.score,
        confidence: recommendations.confidence,
        rationale: recommendations.rationale,
        costEstimate: recommendations.costEstimate,
        timeline: recommendations.timeline,
        drawOddsCtx: recommendations.drawOddsCtx,
        forecastCtx: recommendations.forecastCtx,
        factors: recommendations.factors,
        status: recommendations.status,
        userFeedback: recommendations.userFeedback,
        createdAt: recommendations.createdAt,
        stateCode: states.code,
        stateName: states.name,
        speciesSlug: species.slug,
        speciesName: species.commonName,
      })
      .from(recommendations)
      .innerJoin(states, eq(recommendations.stateId, states.id))
      .innerJoin(species, eq(recommendations.speciesId, species.id))
      .where(
        and(
          eq(recommendations.playbookId, activePlaybook.id),
          eq(recommendations.userId, userId)
        )
      )
      .orderBy(recommendations.rank)
      .$dynamic();

    // Fetch all and filter in memory (Drizzle dynamic where composition is limited)
    const allRecs = await query;

    let filtered = allRecs;

    if (recType) {
      filtered = filtered.filter((r) => r.recType === recType);
    }
    if (orientation) {
      filtered = filtered.filter((r) => r.orientation === orientation);
    }
    if (stateFilter) {
      filtered = filtered.filter(
        (r) => r.stateCode.toUpperCase() === stateFilter.toUpperCase()
      );
    }
    if (speciesFilter) {
      filtered = filtered.filter(
        (r) => r.speciesSlug === speciesFilter.toLowerCase()
      );
    }
    if (timeline) {
      filtered = filtered.filter((r) => r.timeline === timeline);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Format response
    const responseRecs = paginated.map((rec) => ({
      id: rec.id,
      state: {
        id: rec.stateId,
        code: rec.stateCode,
        name: rec.stateName,
      },
      species: {
        id: rec.speciesId,
        slug: rec.speciesSlug,
        name: rec.speciesName,
      },
      huntUnitId: rec.huntUnitId,
      recType: rec.recType,
      orientation: rec.orientation,
      rank: rec.rank,
      score: rec.score,
      confidence: rec.confidence,
      rationale: rec.rationale,
      costEstimate: rec.costEstimate,
      timeline: rec.timeline,
      drawOddsContext: rec.drawOddsCtx,
      forecastContext: rec.forecastCtx,
      scoringFactors: rec.factors,
      status: rec.status,
      userFeedback: rec.userFeedback,
      createdAt: rec.createdAt.toISOString(),
    }));

    return NextResponse.json({
      recommendations: responseRecs,
      total,
      page,
      limit,
      playbookId: activePlaybook.id,
      playbookVersion: activePlaybook.version,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST — Submit feedback on a recommendation
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recommendationId, feedback } = body;

    if (!recommendationId || !feedback) {
      return NextResponse.json(
        { error: "recommendationId and feedback are required" },
        { status: 400 }
      );
    }

    if (!["like", "dislike", "save"].includes(feedback)) {
      return NextResponse.json(
        { error: "feedback must be one of: like, dislike, save" },
        { status: 400 }
      );
    }

    console.log(
      `${LOG_PREFIX} POST feedback: userId=${userId} recId=${recommendationId} feedback=${feedback}`
    );

    // Map legacy feedback values to feedback engine actions
    const actionMap: Record<string, "save" | "dismiss" | "like" | "dislike"> = {
      save: "save",
      like: "like",
      dislike: "dislike",
    };
    const action = actionMap[feedback]!;

    // Process feedback: updates recommendation status AND adjusts preference weights
    const result = await processRecommendationFeedback({
      userId,
      recommendationId,
      action,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }

    const newStatus = action === "save" || action === "like" ? "saved" : "dismissed";

    return NextResponse.json({
      success: true,
      recommendationId,
      feedback,
      status: newStatus,
      preferencesAdjusted: result.adjustments,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} POST error:`, error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
