// =============================================================================
// Playbook Generator — Orchestrates the Full Recommendation Pipeline
//
// Candidates -> Scoring -> Optimization -> ROI -> Forecasts -> Explanations -> Playbook
// This is the primary product output — the "personalized hunting strategy."
// =============================================================================

import { eq, and, desc, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  playbooks,
  recommendations,
  deadlines,
  states,
  species,
} from "@/lib/db/schema";

import { getProfile } from "@/services/profile/profile-service";
import { generateCandidates } from "./candidate-generator";
import { scoreCandidates } from "./scoring-engine";
import { optimizeStrategy } from "./strategy-optimizer";
import {
  generateExplanation,
  generatePlaybookSummary,
} from "./explanation-generator";
import { calculateROI } from "./roi-calculator";
import { forecastPointCreep } from "./forecast-engine";

import type { HunterProfile } from "@/services/profile/types";
import type {
  PlaybookData,
  RecommendationOutput,
  ScoredHunt,
  StrategyPlan,
  PointStrategyItem,
} from "./types";

const LOG_PREFIX = "[playbook]";

// =============================================================================
// Helpers
// =============================================================================

function getOrientation(profile: HunterProfile): RecommendationOutput["orientation"] {
  const pref = profile.preferences.find(
    (p) => p.category === "hunt_orientation" && p.key === "orientation"
  );
  const val = pref?.value;
  if (typeof val === "string") {
    if (["trophy", "opportunity", "balanced", "meat", "experience"].includes(val)) {
      return val as RecommendationOutput["orientation"];
    }
  }
  return "balanced";
}

function buildTimelineEstimate(
  hunt: ScoredHunt
): { earliest: string; expected: string; latest: string } {
  const currentYear = new Date().getFullYear();

  switch (hunt.timelineCategory) {
    case "this_year":
      return {
        earliest: `${currentYear}`,
        expected: `${currentYear}`,
        latest: `${currentYear + 1}`,
      };
    case "1-3_years":
      return {
        earliest: `${currentYear}`,
        expected: `${currentYear + 2}`,
        latest: `${currentYear + 3}`,
      };
    case "3-5_years":
      return {
        earliest: `${currentYear + 2}`,
        expected: `${currentYear + 4}`,
        latest: `${currentYear + 5}`,
      };
    case "5+_years":
      return {
        earliest: `${currentYear + 4}`,
        expected: `${currentYear + 6}`,
        latest: `${currentYear + 10}`,
      };
    default:
      return {
        earliest: `${currentYear}`,
        expected: `${currentYear + 1}`,
        latest: `${currentYear + 3}`,
      };
  }
}

async function buildRecommendationOutput(
  hunt: ScoredHunt,
  profile: HunterProfile,
  strategy: StrategyPlan
): Promise<RecommendationOutput> {
  // Generate explanation via Claude
  const rationale = await generateExplanation(hunt, profile, strategy);

  // Calculate ROI
  const roi = await calculateROI(hunt, profile);

  // Get forecast for this state/species (if points-based)
  let forecast = undefined;
  if (hunt.hasPoints) {
    try {
      forecast = await forecastPointCreep(hunt.stateId, hunt.speciesId, hunt.huntUnitId ?? undefined);
    } catch {
      console.log(`${LOG_PREFIX} forecast unavailable for ${hunt.stateCode}/${hunt.speciesSlug}`);
    }
  }

  return {
    hunt,
    rationale,
    costEstimate: hunt.estimatedCost,
    timelineEstimate: buildTimelineEstimate(hunt),
    confidence: hunt.confidence,
    roi,
    forecast,
    orientation: getOrientation(profile),
    status: "active",
  };
}

// =============================================================================
// Upcoming Deadlines
// =============================================================================

async function getUpcomingDeadlines(
  recStateIds: string[],
  _recSpeciesIds: string[]
): Promise<PlaybookData["upcomingDeadlines"]> {
  if (recStateIds.length === 0) return [];

  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  try {
    const rows = await db
      .select({
        stateCode: states.code,
        speciesName: species.commonName,
        deadlineType: deadlines.deadlineType,
        date: deadlines.deadlineDate,
        title: deadlines.title,
        description: deadlines.description,
      })
      .from(deadlines)
      .innerJoin(states, eq(deadlines.stateId, states.id))
      .leftJoin(species, eq(deadlines.speciesId, species.id))
      .where(
        and(
          eq(deadlines.year, currentYear),
          gte(deadlines.deadlineDate, today!)
        )
      )
      .orderBy(deadlines.deadlineDate)
      .limit(20);

    return rows.map((r) => ({
      state: r.stateCode,
      species: r.speciesName ?? "General",
      deadlineType: r.deadlineType,
      date: r.date,
      actionRequired: r.description ?? r.title,
    }));
  } catch {
    console.log(`${LOG_PREFIX} getUpcomingDeadlines: error fetching deadlines`);
    return [];
  }
}

// =============================================================================
// Save Playbook to DB
// =============================================================================

async function savePlaybook(
  userId: string,
  data: PlaybookData,
  nearTermRecs: RecommendationOutput[],
  midTermRecs: RecommendationOutput[],
  longTermRecs: RecommendationOutput[]
): Promise<string> {
  console.log(`${LOG_PREFIX} savePlaybook: saving for user ${userId}`);

  // Archive existing active playbooks
  await db
    .update(playbooks)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(playbooks.userId, userId), eq(playbooks.status, "active")));

  // Insert new playbook
  const [newPlaybook] = await db
    .insert(playbooks)
    .values({
      userId,
      version: data.version,
      status: "active",
      goalsSummary: {
        summary: data.goalsSummary,
        executiveSummary: data.executiveSummary,
        confidenceSummary: data.confidenceSummary,
      },
      strategyData: {
        pointStrategy: data.pointStrategy,
        budgetAllocation: data.budgetAllocation,
        upcomingDeadlines: data.upcomingDeadlines,
        dataSourcesUsed: data.dataSourcesUsed,
        assumptions: data.assumptions,
        profileSnapshot: data.profileSnapshot,
      },
    })
    .returning();

  if (!newPlaybook) {
    throw new Error("Failed to create playbook record");
  }
  const playbookId = newPlaybook.id;

  // Save individual recommendations
  const allRecs = [
    ...nearTermRecs.map((r) => ({ ...r, timeline: "this_year" as const })),
    ...midTermRecs.map((r) => ({ ...r, timeline: "1-3_years" as const })),
    ...longTermRecs.map((r) => ({ ...r, timeline: "3-5_years" as const })),
  ];

  for (let i = 0; i < allRecs.length; i++) {
    const rec = allRecs[i]!;
    await db.insert(recommendations).values({
      playbookId,
      userId,
      stateId: rec.hunt.stateId,
      speciesId: rec.hunt.speciesId,
      huntUnitId: rec.hunt.huntUnitId,
      recType: rec.hunt.recType,
      orientation: rec.orientation,
      rank: i + 1,
      score: rec.hunt.compositeScore,
      confidence: rec.confidence.score,
      rationale: rec.rationale,
      costEstimate: rec.costEstimate,
      timeline: rec.timeline,
      drawOddsCtx: {
        drawRate: rec.hunt.latestDrawRate,
        minPoints: rec.hunt.latestMinPoints,
        maxPoints: rec.hunt.latestMaxPoints,
        avgPoints: rec.hunt.latestAvgPoints,
      },
      forecastCtx: rec.forecast ?? {},
      factors: rec.hunt.factors,
      status: "active",
    });
  }

  console.log(
    `${LOG_PREFIX} savePlaybook: saved playbook ${playbookId} with ${allRecs.length} recommendations`
  );

  return playbookId;
}

// =============================================================================
// Main Pipeline: Generate Playbook
// =============================================================================

/**
 * Generate a complete personalized playbook for a user.
 * Orchestrates the full pipeline: candidates -> scoring -> optimization ->
 * ROI -> forecasts -> explanations -> save.
 */
export async function generatePlaybook(userId: string): Promise<PlaybookData> {
  console.log(`${LOG_PREFIX} generatePlaybook: starting for user ${userId}`);

  // 1. Load hunter profile
  const profile = await getProfile(userId);

  // 2. Check profile completeness
  if (profile.completeness.score < 60) {
    throw new Error(
      `Profile completeness is ${profile.completeness.score}% (minimum 60%). ` +
        `Missing: ${profile.completeness.missingCategories.join(", ")}.`
    );
  }

  console.log(
    `${LOG_PREFIX} generatePlaybook: profile completeness ${profile.completeness.score}%`
  );

  // 3. Generate candidates
  const candidates = await generateCandidates(profile);
  console.log(`${LOG_PREFIX} generatePlaybook: ${candidates.length} candidates generated`);

  if (candidates.length === 0) {
    throw new Error(
      "No hunt candidates found matching your profile. Try broadening your species interests, " +
        "travel tolerance, or budget."
    );
  }

  // 4. Score all candidates
  const scoredHunts = await scoreCandidates(candidates, profile);
  console.log(`${LOG_PREFIX} generatePlaybook: ${scoredHunts.length} candidates scored`);

  // 5. Optimize strategy
  const strategy = await optimizeStrategy(scoredHunts, profile);
  console.log(
    `${LOG_PREFIX} generatePlaybook: strategy optimized — ` +
      `near=${strategy.nearTerm.length} mid=${strategy.midTerm.length} long=${strategy.longTerm.length}`
  );

  // 6. Build RecommendationOutputs with ROI + Forecasts + Explanations
  // Process top recommendations (limit Claude calls for performance)
  const topNearTerm = strategy.nearTerm.slice(0, 5);
  const topMidTerm = strategy.midTerm.slice(0, 5);
  const topLongTerm = strategy.longTerm.slice(0, 3);

  const nearTermRecs: RecommendationOutput[] = [];
  for (const rec of topNearTerm) {
    const output = await buildRecommendationOutput(rec.hunt, profile, strategy);
    nearTermRecs.push(output);
  }

  const midTermRecs: RecommendationOutput[] = [];
  for (const rec of topMidTerm) {
    const output = await buildRecommendationOutput(rec.hunt, profile, strategy);
    midTermRecs.push(output);
  }

  const longTermRecs: RecommendationOutput[] = [];
  for (const rec of topLongTerm) {
    const output = await buildRecommendationOutput(rec.hunt, profile, strategy);
    longTermRecs.push(output);
  }

  // 7. Enrich point strategy with forecasts
  const enrichedPointStrategy: PointStrategyItem[] = [];
  for (const ps of strategy.pointStrategy) {
    let forecast = ps.forecast;
    if (!forecast) {
      try {
        forecast = await forecastPointCreep(ps.stateId, ps.speciesId);
      } catch {
        console.log(
          `${LOG_PREFIX} forecast unavailable for point strategy: ${ps.stateCode}/${ps.speciesName}`
        );
      }
    }
    enrichedPointStrategy.push({ ...ps, forecast });
  }

  // 8. Generate executive summary via Claude
  const executiveSummary = await generatePlaybookSummary(strategy, profile);

  // 9. Get upcoming deadlines
  const stateIds = [
    ...new Set([
      ...nearTermRecs.map((r) => r.hunt.stateId),
      ...midTermRecs.map((r) => r.hunt.stateId),
    ]),
  ];
  const speciesIds = [
    ...new Set([
      ...nearTermRecs.map((r) => r.hunt.speciesId),
      ...midTermRecs.map((r) => r.hunt.speciesId),
    ]),
  ];
  const upcomingDeadlines = await getUpcomingDeadlines(stateIds, speciesIds);

  // 10. Determine version
  const existingPlaybooks = await db
    .select()
    .from(playbooks)
    .where(eq(playbooks.userId, userId))
    .orderBy(desc(playbooks.version))
    .limit(1);

  const latestPlaybook = existingPlaybooks[0];
  const version = latestPlaybook ? latestPlaybook.version + 1 : 1;

  // 11. Assemble playbook
  const playbookData: PlaybookData = {
    id: "", // set after save
    version,
    generatedAt: new Date().toISOString(),
    goalsSummary: buildGoalsSummary(profile),
    profileSnapshot: buildProfileSnapshot(profile),
    executiveSummary,
    nearTerm: nearTermRecs,
    midTerm: midTermRecs,
    longTerm: longTermRecs,
    pointStrategy: enrichedPointStrategy,
    budgetAllocation: strategy.budgetAllocation,
    upcomingDeadlines,
    confidenceSummary: buildConfidenceSummary(nearTermRecs, midTermRecs, longTermRecs),
    dataSourcesUsed: ["State agency draw odds data", "Historical harvest statistics", "Season structure data"],
    assumptions: [
      "Draw odds trends continue at historical rates",
      "Tag fees and license costs remain similar to current levels",
      "Point purchase costs remain unchanged",
      "Travel cost estimates based on distance from home state",
      ...strategy.warnings.map((w) => `Note: ${w}`),
    ],
  };

  // 12. Save to DB
  const playbookId = await savePlaybook(userId, playbookData, nearTermRecs, midTermRecs, longTermRecs);
  playbookData.id = playbookId;

  console.log(
    `${LOG_PREFIX} generatePlaybook: completed playbook ${playbookId} v${version} ` +
      `with ${nearTermRecs.length + midTermRecs.length + longTermRecs.length} recommendations`
  );

  return playbookData;
}

// =============================================================================
// Refresh Playbook
// =============================================================================

/**
 * Re-run the pipeline with updated data. Archives old version, creates new version.
 */
export async function refreshPlaybook(
  userId: string,
  _playbookId: string
): Promise<PlaybookData> {
  console.log(`${LOG_PREFIX} refreshPlaybook: refreshing for user ${userId}`);

  // Simply regenerate — the generate function handles archiving old versions
  return generatePlaybook(userId);
}

// =============================================================================
// Get Playbook
// =============================================================================

/**
 * Load the active playbook for a user from the database.
 */
export async function getPlaybook(userId: string): Promise<PlaybookData | null> {
  console.log(`${LOG_PREFIX} getPlaybook: loading for user ${userId}`);

  // Find active playbook
  const activePlaybook = await db.query.playbooks.findFirst({
    where: and(eq(playbooks.userId, userId), eq(playbooks.status, "active")),
  });

  if (!activePlaybook) {
    console.log(`${LOG_PREFIX} getPlaybook: no active playbook found`);
    return null;
  }

  // Load recommendations for this playbook
  const recs = await db
    .select({
      id: recommendations.id,
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
      stateCode: states.code,
      stateName: states.name,
      speciesSlug: species.slug,
      speciesName: species.commonName,
    })
    .from(recommendations)
    .innerJoin(states, eq(recommendations.stateId, states.id))
    .innerJoin(species, eq(recommendations.speciesId, species.id))
    .where(eq(recommendations.playbookId, activePlaybook.id))
    .orderBy(recommendations.rank);

  // Parse into PlaybookData structure
  const goalsSummary = activePlaybook.goalsSummary as Record<string, unknown>;
  const strategyData = activePlaybook.strategyData as Record<string, unknown>;

  const nearTermRecs: RecommendationOutput[] = [];
  const midTermRecs: RecommendationOutput[] = [];
  const longTermRecs: RecommendationOutput[] = [];

  for (const rec of recs) {
    const output: RecommendationOutput = {
      id: rec.id,
      hunt: {
        stateId: rec.stateId,
        stateCode: rec.stateCode,
        stateName: rec.stateName,
        speciesId: rec.speciesId,
        speciesSlug: rec.speciesSlug,
        speciesName: rec.speciesName,
        huntUnitId: rec.huntUnitId,
        unitCode: null,
        unitName: null,
        publicLandPct: null,
        terrainClass: null,
        elevationMin: null,
        elevationMax: null,
        hasDraw: false,
        hasOtc: rec.recType === "otc_opportunity",
        hasPoints: false,
        pointType: null,
        weaponTypes: [],
        latestDrawRate: (rec.drawOddsCtx as Record<string, unknown>)?.drawRate as number | null ?? null,
        latestMinPoints: (rec.drawOddsCtx as Record<string, unknown>)?.minPoints as number | null ?? null,
        latestMaxPoints: (rec.drawOddsCtx as Record<string, unknown>)?.maxPoints as number | null ?? null,
        latestAvgPoints: (rec.drawOddsCtx as Record<string, unknown>)?.avgPoints as number | null ?? null,
        totalApplicants: null,
        totalTags: null,
        latestSuccessRate: null,
        trophyMetrics: null,
        tagType: rec.recType === "otc_opportunity" ? "otc" : "draw",
        seasonName: null,
        seasonStart: null,
        seasonEnd: null,
        estimatedCost: rec.costEstimate as RecommendationOutput["costEstimate"],
        estimatedDriveHours: null,
        filtersApplied: [],
        factors: rec.factors as RecommendationOutput["hunt"]["factors"],
        weightsUsed: {
          draw_odds: 0.2,
          trophy_quality: 0.15,
          success_rate: 0.15,
          cost_efficiency: 0.15,
          access: 0.1,
          forecast: 0.1,
          personal_fit: 0.1,
          timeline_fit: 0.05,
        },
        compositeScore: rec.score ?? 0,
        rank: rec.rank ?? 0,
        confidence: {
          score: rec.confidence ?? 0.5,
          label: (rec.confidence ?? 0.5) >= 0.7 ? "high" : (rec.confidence ?? 0.5) >= 0.4 ? "medium" : "low",
          basis: "Loaded from saved playbook data.",
        },
        timelineCategory: (rec.timeline ?? "1-3_years") as RecommendationOutput["hunt"]["timelineCategory"],
        recType: rec.recType as RecommendationOutput["hunt"]["recType"],
      },
      rationale: rec.rationale ?? "",
      costEstimate: rec.costEstimate as RecommendationOutput["costEstimate"],
      timelineEstimate: { earliest: "", expected: "", latest: "" },
      confidence: {
        score: rec.confidence ?? 0.5,
        label: (rec.confidence ?? 0.5) >= 0.7 ? "high" : (rec.confidence ?? 0.5) >= 0.4 ? "medium" : "low",
        basis: "Loaded from saved playbook data.",
      },
      orientation: (rec.orientation ?? "balanced") as RecommendationOutput["orientation"],
      status: (rec.status ?? "active") as RecommendationOutput["status"],
    };

    if (rec.timeline === "this_year") {
      nearTermRecs.push(output);
    } else if (rec.timeline === "1-3_years") {
      midTermRecs.push(output);
    } else {
      longTermRecs.push(output);
    }
  }

  return {
    id: activePlaybook.id,
    version: activePlaybook.version,
    generatedAt: activePlaybook.generatedAt.toISOString(),
    goalsSummary: (goalsSummary?.summary as string) ?? "",
    profileSnapshot: (strategyData?.profileSnapshot as Record<string, unknown>) ?? {},
    executiveSummary: (goalsSummary?.executiveSummary as string) ?? "",
    nearTerm: nearTermRecs,
    midTerm: midTermRecs,
    longTerm: longTermRecs,
    pointStrategy: (strategyData?.pointStrategy as PointStrategyItem[]) ?? [],
    budgetAllocation: (strategyData?.budgetAllocation as PlaybookData["budgetAllocation"]) ?? {
      totalBudget: 0,
      allocations: [],
      unallocated: 0,
    },
    upcomingDeadlines: (strategyData?.upcomingDeadlines as PlaybookData["upcomingDeadlines"]) ?? [],
    confidenceSummary: (goalsSummary?.confidenceSummary as string) ?? "",
    dataSourcesUsed: (strategyData?.dataSourcesUsed as string[]) ?? [],
    assumptions: (strategyData?.assumptions as string[]) ?? [],
  };
}

// =============================================================================
// Helpers
// =============================================================================

function buildGoalsSummary(profile: HunterProfile): string {
  const parts: string[] = [];

  const speciesInterests = profile.preferences
    .filter((p) => p.category === "species_interest" && p.value === true)
    .map((p) => p.key.replace(/_/g, " "));

  if (speciesInterests.length > 0) {
    parts.push(`Interested in: ${speciesInterests.join(", ")}`);
  }

  const orientation = profile.preferences.find(
    (p) => p.category === "hunt_orientation" && p.key === "orientation"
  )?.value;
  if (orientation) parts.push(`Orientation: ${orientation}`);

  const timeline = profile.preferences.find(
    (p) => p.category === "timeline" && p.key === "timeline"
  )?.value;
  if (timeline) parts.push(`Timeline: ${timeline}`);

  if (profile.pointHoldings.length > 0) {
    const holdingSummary = profile.pointHoldings
      .map((h) => `${h.stateCode} ${h.speciesName}: ${h.points} pts`)
      .join(", ");
    parts.push(`Point holdings: ${holdingSummary}`);
  }

  return parts.join(". ") + ".";
}

function buildProfileSnapshot(profile: HunterProfile): Record<string, unknown> {
  return {
    userId: profile.id,
    completenessScore: profile.completeness.score,
    preferenceSummary: profile.preferences
      .filter((p) => p.source === "user")
      .reduce(
        (acc, p) => {
          acc[`${p.category}/${p.key}`] = p.value;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    pointHoldings: profile.pointHoldings.map((h) => ({
      state: h.stateCode,
      species: h.speciesName,
      points: h.points,
      pointType: h.pointType,
    })),
    snapshotDate: new Date().toISOString(),
  };
}

function buildConfidenceSummary(
  nearTerm: RecommendationOutput[],
  midTerm: RecommendationOutput[],
  longTerm: RecommendationOutput[]
): string {
  const all = [...nearTerm, ...midTerm, ...longTerm];
  if (all.length === 0) return "No recommendations generated.";

  const highConf = all.filter((r) => r.confidence.label === "high").length;
  const medConf = all.filter((r) => r.confidence.label === "medium").length;
  const lowConf = all.filter((r) => r.confidence.label === "low").length;

  const parts: string[] = [];
  parts.push(`${all.length} total recommendations.`);
  if (highConf > 0) parts.push(`${highConf} high-confidence (solid agency data).`);
  if (medConf > 0) parts.push(`${medConf} medium-confidence (some data gaps).`);
  if (lowConf > 0) parts.push(`${lowConf} low-confidence (limited data — use with caution).`);

  return parts.join(" ");
}
