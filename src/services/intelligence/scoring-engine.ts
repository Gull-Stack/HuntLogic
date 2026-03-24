// =============================================================================
// Multi-Factor Scoring Engine — Stage 2 of the Recommendation Pipeline
//
// Scores each hunt candidate across multiple factors, producing a weighted
// composite score. Weights are configurable per user via preferences.
// =============================================================================

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { drawOdds, harvestStats } from "@/lib/db/schema";

import type { HunterProfile } from "@/services/profile/types";
import type {
  HuntCandidate,
  ScoredHunt,
  ScoringWeights,
  ScoringFactors,
  ConfidenceLevel,
} from "./types";
import { DEFAULT_WEIGHTS, ORIENTATION_WEIGHTS } from "./types";
import { SCORING_CONFIG, FORECAST_CONFIG } from "./config";

const LOG_PREFIX = "[intelligence]";

// =============================================================================
// Weight Resolution
// =============================================================================

/**
 * Resolve scoring weights for a given profile.
 * Priority: user-specified > orientation preset > defaults.
 */
export function resolveWeights(profile: HunterProfile): ScoringWeights {
  // Check for explicit user weights preference
  const weightsPrefs = profile.preferences.find(
    (p) => p.category === "hunt_orientation" && p.key === "scoring_weights"
  );
  if (weightsPrefs && typeof weightsPrefs.value === "object" && weightsPrefs.value !== null) {
    return { ...DEFAULT_WEIGHTS, ...(weightsPrefs.value as Partial<ScoringWeights>) };
  }

  // Fall back to orientation preset
  const orientationPref = profile.preferences.find(
    (p) => p.category === "hunt_orientation" && p.key === "orientation"
  );
  const orientation =
    typeof orientationPref?.value === "string" ? orientationPref.value : "balanced";

  const preset = ORIENTATION_WEIGHTS[orientation];
  if (preset) {
    return { ...DEFAULT_WEIGHTS, ...preset } as ScoringWeights;
  }

  return { ...DEFAULT_WEIGHTS };
}

// =============================================================================
// Individual Scoring Functions (each returns 0.0 to 1.0)
// =============================================================================

/**
 * Score draw odds: how likely is this hunter to draw this tag?
 */
export async function scoreDrawOdds(
  candidate: HuntCandidate,
  profile: HunterProfile
): Promise<number> {
  // OTC = guaranteed tag
  if (candidate.hasOtc && candidate.tagType === "otc") return 1.0;
  if (!candidate.hasDraw) return SCORING_CONFIG.unknownDrawDefault; // Unknown draw status → assume decent

  // Check draw rate directly from candidate data
  if (candidate.latestDrawRate !== null) {
    // Get user's points for this state/species.
    // Primary source: point_holdings table (verified, structured).
    // Fallback: hunter_preferences experience category (where onboarding stores them).
    const holding = profile.pointHoldings.find(
      (p) => p.stateId === candidate.stateId && p.speciesId === candidate.speciesId
    );
    let userPoints = holding?.points ?? 0;

    if (userPoints === 0) {
      // Try experience prefs: key = "points_{STATE}_{species_slug}"
      const expPref = profile.preferences.find(
        (p) =>
          p.category === "experience" &&
          p.key === `points_${candidate.stateCode}_${candidate.speciesSlug}` &&
          typeof (p.value as Record<string, unknown>)?.points === "number"
      );
      if (expPref) {
        userPoints = (expPref.value as Record<string, unknown>).points as number;
      }
    }

    // If user has points above the min required, boost score
    const minPoints = candidate.latestMinPoints ?? 0;
    if (candidate.hasPoints && minPoints > 0) {
      if (userPoints >= minPoints) {
        // At or above the minimum — draw rate is directly applicable or better
        return Math.min(1.0, candidate.latestDrawRate + SCORING_CONFIG.drawOddsBoost);
      }
      // Below the minimum — penalize proportionally
      const deficit = minPoints - userPoints;
      const deficitPenalty = Math.min(SCORING_CONFIG.maxDeficitPenalty, deficit * SCORING_CONFIG.deficitPenaltyPerPoint);
      return Math.max(SCORING_CONFIG.drawOddsFloor, candidate.latestDrawRate - deficitPenalty);
    }

    // No point system or no min points → use raw draw rate
    return candidate.latestDrawRate;
  }

  // If we have unit-level data, try to fetch more recent from DB
  if (candidate.huntUnitId) {
    const latest = await db
      .select()
      .from(drawOdds)
      .where(
        and(
          eq(drawOdds.stateId, candidate.stateId),
          eq(drawOdds.speciesId, candidate.speciesId),
          eq(drawOdds.huntUnitId, candidate.huntUnitId)
        )
      )
      .orderBy(desc(drawOdds.year))
      .limit(1);

    const latestRow = latest[0];
    if (latestRow && latestRow.drawRate !== null) {
      return latestRow.drawRate;
    }
  }

  // No data → moderate default
  return SCORING_CONFIG.noDataDrawDefault;
}

/**
 * Score trophy quality: how good are the trophies in this unit?
 */
export async function scoreTrophyQuality(
  candidate: HuntCandidate,
  profile: HunterProfile
): Promise<number> {
  const orientation = profile.preferences.find(
    (p) => p.category === "hunt_orientation" && p.key === "orientation"
  )?.value;

  // If meat-focused, trophy quality is a non-factor — return neutral
  if (orientation === "meat") return SCORING_CONFIG.meatOrientationTrophyDefault;

  // Check candidate's trophy metrics
  if (candidate.trophyMetrics) {
    const metrics = candidate.trophyMetrics;

    // Look for B&C scores, antler size, age class data
    const avgScore = (metrics.avg_bc_score ?? metrics.avg_trophy_score ?? null) as number | null;
    const maturePercent = (metrics.mature_percent ?? metrics.age_class_mature ?? null) as number | null;

    if (avgScore !== null) {
      // Normalize B&C scores — this varies wildly by species
      // Use a simple approach: any score available means some quality tracking
      return Math.min(1.0, Math.max(SCORING_CONFIG.trophyMinScore, avgScore > 0 ? SCORING_CONFIG.trophyBaseScore + (avgScore / SCORING_CONFIG.trophyBcDivisor) : SCORING_CONFIG.trophyNoScoreDefault));
    }

    if (maturePercent !== null) {
      return Math.min(1.0, maturePercent);
    }
  }

  // Try loading from DB if we have a unit
  if (candidate.huntUnitId) {
    const stats = await db
      .select()
      .from(harvestStats)
      .where(
        and(
          eq(harvestStats.stateId, candidate.stateId),
          eq(harvestStats.speciesId, candidate.speciesId),
          eq(harvestStats.huntUnitId, candidate.huntUnitId)
        )
      )
      .orderBy(desc(harvestStats.year))
      .limit(1);

    const trophyStat = stats[0];
    if (trophyStat && trophyStat.trophyMetrics) {
      const tm = trophyStat.trophyMetrics as Record<string, unknown>;
      const score = (tm.avg_bc_score ?? tm.avg_trophy_score ?? null) as number | null;
      if (score !== null && score > 0) {
        return Math.min(1.0, SCORING_CONFIG.trophyDbBaseScore + (score / SCORING_CONFIG.trophyBcDivisor));
      }
    }
  }

  // No data → moderate default
  return SCORING_CONFIG.trophyNoDataDefault;
}

/**
 * Score success rate: how likely is a hunter to harvest in this unit?
 */
export async function scoreSuccessRate(candidate: HuntCandidate): Promise<number> {
  if (candidate.latestSuccessRate !== null) {
    return Math.min(1.0, candidate.latestSuccessRate);
  }

  // Try loading from DB
  if (candidate.huntUnitId) {
    const stats = await db
      .select()
      .from(harvestStats)
      .where(
        and(
          eq(harvestStats.stateId, candidate.stateId),
          eq(harvestStats.speciesId, candidate.speciesId),
          eq(harvestStats.huntUnitId, candidate.huntUnitId)
        )
      )
      .orderBy(desc(harvestStats.year))
      .limit(1);

    const successStat = stats[0];
    if (successStat && successStat.successRate !== null) {
      return successStat.successRate;
    }
  }

  // Default moderate success rate
  return SCORING_CONFIG.successRateNoDataDefault;
}

/**
 * Score cost efficiency: is this hunt good value for the budget?
 */
export function scoreCostEfficiency(
  candidate: HuntCandidate,
  profile: HunterProfile
): number {
  const budgetPref = profile.preferences.find(
    (p) => p.category === "budget" && p.key === "annual_budget"
  );

  let budget = SCORING_CONFIG.defaultBudget;
  if (budgetPref) {
    if (typeof budgetPref.value === "number") {
      budget = budgetPref.value;
    } else if (typeof budgetPref.value === "string") {
      const mapped = SCORING_CONFIG.budgetMappings[budgetPref.value];
      if (mapped !== undefined) {
        budget = mapped;
      } else {
        const parsed = parseInt(budgetPref.value, 10);
        if (!isNaN(parsed)) budget = parsed;
      }
    }
  }

  const totalCost = candidate.estimatedCost.total;
  if (totalCost <= 0) return 1.0;

  // Score inversely to cost-to-budget ratio
  const ratio = totalCost / budget;
  for (const tier of SCORING_CONFIG.costRatioTiers) {
    if (ratio <= tier.maxRatio) return tier.score;
  }
  return SCORING_CONFIG.wayOverBudgetScore; // Over budget
}

/**
 * Score access: how accessible is this hunting unit?
 */
export function scoreAccess(
  candidate: HuntCandidate,
  profile: HunterProfile
): number {
  const preferPrivate = profile.preferences.find(
    (p) => p.category === "land_access" && p.key === "private_land_likely"
  )?.value === true;

  if (candidate.publicLandPct === null) return SCORING_CONFIG.accessUnknownDefault; // Unknown → neutral

  if (preferPrivate) {
    // User prefers private land — less public land is fine
    return SCORING_CONFIG.accessUnknownDefault + (1 - candidate.publicLandPct / 100) * SCORING_CONFIG.accessUnknownDefault;
  }

  // Default: more public land = better access score
  const pct = candidate.publicLandPct / 100;
  for (const tier of SCORING_CONFIG.publicLandTiers) {
    if (pct >= tier.minPct / 100) return tier.score;
  }
  return SCORING_CONFIG.publicLandLowScore;
}

/**
 * Score forecast: is this opportunity getting better or worse?
 */
export async function scoreForecast(candidate: HuntCandidate): Promise<number> {
  // Load multi-year draw odds to determine trend
  if (!candidate.huntUnitId) return SCORING_CONFIG.forecastNoDataDefault; // No unit → can't forecast

  const historicalOdds = await db
    .select()
    .from(drawOdds)
    .where(
      and(
        eq(drawOdds.stateId, candidate.stateId),
        eq(drawOdds.speciesId, candidate.speciesId),
        eq(drawOdds.huntUnitId, candidate.huntUnitId)
      )
    )
    .orderBy(desc(drawOdds.year))
    .limit(FORECAST_CONFIG.maxForecastRecords);

  if (historicalOdds.length < 2) return SCORING_CONFIG.forecastNoDataDefault; // Insufficient data → neutral

  // Check point creep trend
  const pointValues = historicalOdds
    .filter((r) => r.minPointsDrawn !== null)
    .map((r) => ({ year: r.year, points: r.minPointsDrawn! }))
    .sort((a, b) => a.year - b.year);

  if (pointValues.length >= 2) {
    const pvFirst = pointValues[0]!;
    const pvLast = pointValues[pointValues.length - 1]!;
    const yearDiff = pvLast.year - pvFirst.year;
    if (yearDiff > 0) {
      const annualChange = (pvLast.points - pvFirst.points) / yearDiff;
      const t = SCORING_CONFIG.pointCreepThresholds;
      if (annualChange > t.risingFast.threshold) return t.risingFast.score;
      if (annualChange > t.risingSlow.threshold) return t.risingSlow.score;
      if (annualChange > t.stable.threshold) return t.stable.score;
      if (annualChange > t.decliningSlow.threshold) return t.decliningSlow.score;
      return t.decliningFast.score; // Declining point requirements — getting easier
    }
  }

  // Check draw rate trend
  const rateValues = historicalOdds
    .filter((r) => r.drawRate !== null)
    .map((r) => ({ year: r.year, rate: r.drawRate! }))
    .sort((a, b) => a.year - b.year);

  if (rateValues.length >= 2) {
    const rvFirst = rateValues[0]!;
    const rvLast = rateValues[rateValues.length - 1]!;
    const yearDiff = rvLast.year - rvFirst.year;
    if (yearDiff > 0) {
      const annualChange = (rvLast.rate - rvFirst.rate) / yearDiff;
      const t = SCORING_CONFIG.drawRateTrend;
      if (annualChange > t.improving.threshold) return t.improving.score;
      if (annualChange > t.slightlyImproving.threshold) return t.slightlyImproving.score;
      if (annualChange > t.slightlyDeclining.threshold) return t.slightlyDeclining.score;
      return t.declining.score; // Declining draw odds
    }
  }

  return SCORING_CONFIG.forecastNoDataDefault;
}

/**
 * Score personal fit: how well does this match stated preferences?
 */
export function scorePersonalFit(
  candidate: HuntCandidate,
  profile: HunterProfile
): number {
  let score = SCORING_CONFIG.personalFitBaseline; // baseline
  let factors = 0;

  // Weapon match
  const weaponPref = profile.preferences.find(
    (p) => p.category === "weapon" && p.key === "weapon"
  );
  if (weaponPref) {
    factors++;
    const prefs = Array.isArray(weaponPref.value)
      ? (weaponPref.value as string[])
      : [weaponPref.value as string];

    const hasMatch = prefs.some((wp) =>
      candidate.weaponTypes.some((wt) =>
        wt.toLowerCase().includes(wp.toLowerCase())
      )
    );
    score += hasMatch ? SCORING_CONFIG.weaponMatchBonus : SCORING_CONFIG.weaponMismatchPenalty;
  }

  // Terrain match vs physical ability
  const physicalPref = profile.preferences.find(
    (p) => p.category === "physical" && p.key === "physical_ability"
  );
  if (physicalPref && candidate.terrainClass) {
    factors++;
    const ability = physicalPref.value as string;
    if (ability === "high") {
      // High ability hunters match well with alpine/rugged
      score += candidate.terrainClass === "alpine" ? SCORING_CONFIG.terrainHighAbilityAlpineBonus : SCORING_CONFIG.terrainHighAbilityOtherBonus;
    } else if (ability === "limited") {
      score += candidate.terrainClass === "prairie" || candidate.terrainClass === "mixed"
        ? SCORING_CONFIG.terrainLimitedGoodMatch
        : SCORING_CONFIG.terrainLimitedBadMatch;
    } else {
      score += SCORING_CONFIG.terrainModerateBonus; // Moderate matches most terrain
    }
  }

  // Distance from home (closer = slight bonus for opportunity hunters)
  if (candidate.estimatedDriveHours !== null) {
    factors++;
    if (candidate.estimatedDriveHours <= 4) score += SCORING_CONFIG.driveHourBonusShort;
    else if (candidate.estimatedDriveHours <= 8) score += SCORING_CONFIG.driveHourBonusMedium;
    else if (candidate.estimatedDriveHours > 20) score += SCORING_CONFIG.driveHourPenaltyLong;
  }

  // Hunt style match
  const diyPref = profile.preferences.find(
    (p) => p.category === "hunt_style" && p.key === "diy_preference"
  );
  if (diyPref?.value === true && candidate.publicLandPct !== null) {
    factors++;
    score += candidate.publicLandPct > 50 ? SCORING_CONFIG.diyPublicLandBonus : SCORING_CONFIG.diyPrivateLandPenalty;
  }

  // Normalize to 0-1 range
  return Math.max(0, Math.min(1.0, score + (factors > 0 ? 0 : 0)));
}

/**
 * Score timeline fit: does this match when the hunter wants to hunt?
 */
export function scoreTimelineFit(
  candidate: HuntCandidate,
  profile: HunterProfile
): number {
  const timelinePref = profile.preferences.find(
    (p) => p.category === "timeline" && p.key === "timeline"
  );

  const timeline = (timelinePref?.value as string) ?? "flexible";

  const ty = SCORING_CONFIG.timelineThisYear;
  const lt = SCORING_CONFIG.timelineLongTerm;
  const fl = SCORING_CONFIG.timelineFlexible;

  if (timeline === "this_year") {
    // User wants to hunt NOW — favor OTC and high-odds draws
    if (candidate.hasOtc || candidate.tagType === "otc") return ty.otcScore;
    if (candidate.tagType === "leftover") return ty.leftoverScore;
    if (candidate.latestDrawRate !== null) {
      if (candidate.latestDrawRate > ty.highOddsThreshold) return ty.highOddsScore;
      if (candidate.latestDrawRate > ty.medOddsThreshold) return ty.medOddsScore;
      return ty.lowOddsScore; // Low odds + this_year = bad fit
    }
    return ty.unknownScore;
  }

  if (timeline === "long_term") {
    // User is willing to wait — point-building is fine
    if (candidate.hasPoints && candidate.latestMinPoints !== null) {
      // Point building opportunity
      const holding = profile.pointHoldings.find(
        (p) => p.stateId === candidate.stateId && p.speciesId === candidate.speciesId
      );
      let points = holding?.points ?? 0;
      if (points === 0) {
        const expPref = profile.preferences.find(
          (p) =>
            p.category === "experience" &&
            p.key === `points_${candidate.stateCode}_${candidate.speciesSlug}` &&
            typeof (p.value as Record<string, unknown>)?.points === "number"
        );
        if (expPref) points = (expPref.value as Record<string, unknown>).points as number;
      }
      const minNeeded = candidate.latestMinPoints;

      if (points >= minNeeded) return lt.drawableScore; // Already drawable
      if (minNeeded - points <= lt.closeDeficit) return lt.closeScore; // Close
      if (minNeeded - points <= lt.medDeficit) return lt.medScore; // Medium wait
      return lt.farScore; // Long wait but user is OK with it
    }
    return lt.noPointsScore;
  }

  // Flexible or unknown → moderate score for everything
  if (candidate.hasOtc || candidate.tagType === "otc") return fl.otcScore;
  if (candidate.latestDrawRate !== null && candidate.latestDrawRate > fl.goodOddsThreshold) return fl.goodOddsScore;
  return fl.defaultScore;
}

// =============================================================================
// Confidence Assessment
// =============================================================================

function assessConfidence(candidate: HuntCandidate, factors: ScoringFactors): ConfidenceLevel {
  let dataPoints = 0;
  const totalPossible = SCORING_CONFIG.totalDataPoints; // draw odds, harvest, trophy, forecast, access, season

  if (candidate.latestDrawRate !== null) dataPoints++;
  if (candidate.latestSuccessRate !== null) dataPoints++;
  if (candidate.trophyMetrics !== null) dataPoints++;
  if (candidate.publicLandPct !== null) dataPoints++;
  if (candidate.seasonName !== null) dataPoints++;
  if (candidate.totalApplicants !== null) dataPoints++;

  const dataRatio = dataPoints / totalPossible;

  // Factor spread — if scores are very uniform, we have less differentiation
  const factorValues = Object.values(factors);
  const avg = factorValues.reduce((a, b) => a + b, 0) / factorValues.length;
  const variance = factorValues.reduce((a, b) => a + (b - avg) ** 2, 0) / factorValues.length;

  const score = Math.min(1.0, dataRatio * SCORING_CONFIG.confidenceDataRatioWeight + (1 - Math.min(1, variance * SCORING_CONFIG.confidenceVarianceScale)) * SCORING_CONFIG.confidenceVarianceWeight);

  let label: "high" | "medium" | "low";
  let basis: string;

  if (score >= SCORING_CONFIG.confidenceHighThreshold) {
    label = "high";
    basis = `Based on ${dataPoints} data points including ${
      candidate.latestDrawRate !== null ? "draw odds" : ""
    }${candidate.latestSuccessRate !== null ? ", harvest stats" : ""}. Solid agency data.`;
  } else if (score >= SCORING_CONFIG.confidenceMedThreshold) {
    label = "medium";
    basis = `Based on ${dataPoints} data points. Some data gaps exist ${
      candidate.latestDrawRate === null ? "(missing draw odds)" : ""
    }${candidate.latestSuccessRate === null ? "(missing harvest data)" : ""}.`;
  } else {
    label = "low";
    basis = `Limited data available (${dataPoints}/${totalPossible} data points). This recommendation has more uncertainty.`;
  }

  return { score, label, basis: basis.replace(/\s+/g, " ").trim() };
}

// =============================================================================
// Timeline Classification
// =============================================================================

function classifyTimeline(
  candidate: HuntCandidate,
  profile: HunterProfile
): "this_year" | "1-3_years" | "3-5_years" | "5+_years" {
  if (candidate.hasOtc || candidate.tagType === "otc" || candidate.tagType === "leftover") {
    return "this_year";
  }

  if (!candidate.hasPoints || candidate.latestMinPoints === null) {
    if (candidate.latestDrawRate !== null && candidate.latestDrawRate > SCORING_CONFIG.timelineDrawRateThisYear) {
      return "this_year";
    }
    return "1-3_years";
  }

  const holding = profile.pointHoldings.find(
    (p) => p.stateId === candidate.stateId && p.speciesId === candidate.speciesId
  );
  let userPoints = holding?.points ?? 0;
  if (userPoints === 0) {
    const expPref = profile.preferences.find(
      (p) =>
        p.category === "experience" &&
        p.key === `points_${candidate.stateCode}_${candidate.speciesSlug}` &&
        typeof (p.value as Record<string, unknown>)?.points === "number"
    );
    if (expPref) userPoints = (expPref.value as Record<string, unknown>).points as number;
  }
  const deficit = (candidate.latestMinPoints ?? 0) - userPoints;

  if (deficit <= 0) return "this_year";
  if (deficit <= SCORING_CONFIG.timelineCloseDeficit) return "1-3_years";
  if (deficit <= SCORING_CONFIG.timelineMedDeficit) return "3-5_years";
  return "5+_years";
}

// =============================================================================
// Recommendation Type Classification
// =============================================================================

function classifyRecType(
  candidate: HuntCandidate,
  timeline: "this_year" | "1-3_years" | "3-5_years" | "5+_years",
  compositeScore: number
): "apply_now" | "build_points" | "otc_opportunity" | "watch" {
  if (candidate.hasOtc || candidate.tagType === "otc") return "otc_opportunity";

  if (timeline === "this_year") {
    if (candidate.latestDrawRate !== null && candidate.latestDrawRate > SCORING_CONFIG.recTypeApplyNowDrawRate) {
      return "apply_now";
    }
  }

  if (timeline === "1-3_years" && candidate.hasPoints) {
    return "build_points";
  }

  if (compositeScore > SCORING_CONFIG.recTypeApplyNowMinScore && timeline !== "5+_years") return "apply_now";
  if (candidate.hasPoints) return "build_points";

  return "watch";
}

// =============================================================================
// Main Scoring Functions
// =============================================================================

/**
 * Score a single candidate across all factors.
 */
export async function scoreCandidate(
  candidate: HuntCandidate,
  profile: HunterProfile,
  weights?: ScoringWeights
): Promise<ScoredHunt> {
  const w = weights ?? resolveWeights(profile);

  // Compute all factor scores
  const [drawOddsScore, trophyScore, successScore, forecastScore] = await Promise.all([
    scoreDrawOdds(candidate, profile),
    scoreTrophyQuality(candidate, profile),
    scoreSuccessRate(candidate),
    scoreForecast(candidate),
  ]);

  const costScore = scoreCostEfficiency(candidate, profile);
  const accessScore = scoreAccess(candidate, profile);
  const personalScore = scorePersonalFit(candidate, profile);
  const timelineScore = scoreTimelineFit(candidate, profile);

  const factors: ScoringFactors = {
    draw_odds_score: drawOddsScore,
    trophy_quality_score: trophyScore,
    success_rate_score: successScore,
    cost_efficiency_score: costScore,
    access_score: accessScore,
    forecast_score: forecastScore,
    personal_fit_score: personalScore,
    timeline_fit_score: timelineScore,
  };

  // Weighted composite
  const compositeScore =
    w.draw_odds * factors.draw_odds_score +
    w.trophy_quality * factors.trophy_quality_score +
    w.success_rate * factors.success_rate_score +
    w.cost_efficiency * factors.cost_efficiency_score +
    w.access * factors.access_score +
    w.forecast * factors.forecast_score +
    w.personal_fit * factors.personal_fit_score +
    w.timeline_fit * factors.timeline_fit_score;

  const confidence = assessConfidence(candidate, factors);
  const timelineCategory = classifyTimeline(candidate, profile);
  const recType = classifyRecType(candidate, timelineCategory, compositeScore);

  return {
    ...candidate,
    factors,
    weightsUsed: w,
    compositeScore: Math.round(compositeScore * 1000) / 1000,
    rank: 0, // set during batch ranking
    confidence,
    timelineCategory,
    recType,
  };
}

/**
 * Score all candidates and rank them by composite score.
 */
export async function scoreCandidates(
  candidates: HuntCandidate[],
  profile: HunterProfile
): Promise<ScoredHunt[]> {
  console.log(`${LOG_PREFIX} scoreCandidates: scoring ${candidates.length} candidates`);

  const weights = resolveWeights(profile);

  // Score in batches to avoid overwhelming the DB
  const batchSize = SCORING_CONFIG.scoringBatchSize;
  const scored: ScoredHunt[] = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((c) => scoreCandidate(c, profile, weights))
    );
    scored.push(...batchResults);
  }

  // Sort by composite score descending
  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  // Assign ranks
  scored.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  console.log(
    `${LOG_PREFIX} scoreCandidates: top 5 scores: ${scored
      .slice(0, 5)
      .map((s) => `${s.stateCode}/${s.speciesSlug}/${s.unitCode ?? "state"}=${s.compositeScore}`)
      .join(", ")}`
  );

  return scored;
}
