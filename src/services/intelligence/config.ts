// =============================================================================
// Intelligence Engine Configuration
// =============================================================================
// All tuning parameters for scoring, forecasting, and recommendations.
// Centralized here for easy adjustment and DB-driven override support.
// Use loadScoringConfig() to get config with DB overrides merged in.
// =============================================================================

import type { ScoringWeights } from "./types";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema/config";
import { eq } from "drizzle-orm";
import { config } from "@/lib/config";

// =============================================================================
// Scoring Configuration
// =============================================================================

export const SCORING_CONFIG = {
  // Default orientation weights (must sum to 1.0)
  defaultWeights: {
    draw_odds: 0.20,
    trophy_quality: 0.15,
    success_rate: 0.15,
    cost_efficiency: 0.15,
    access: 0.10,
    forecast: 0.10,
    personal_fit: 0.10,
    timeline_fit: 0.05,
  } as ScoringWeights,

  // Orientation-specific weight presets
  orientationWeights: {
    trophy: {
      trophy_quality: 0.25,
      success_rate: 0.10,
      draw_odds: 0.15,
      forecast: 0.10,
      cost_efficiency: 0.10,
      access: 0.10,
      personal_fit: 0.10,
      timeline_fit: 0.10,
    },
    meat: {
      success_rate: 0.25,
      trophy_quality: 0.05,
      draw_odds: 0.20,
      cost_efficiency: 0.20,
      access: 0.10,
      forecast: 0.05,
      personal_fit: 0.10,
      timeline_fit: 0.05,
    },
    experience: {
      access: 0.20,
      personal_fit: 0.15,
      trophy_quality: 0.10,
      success_rate: 0.10,
      draw_odds: 0.15,
      cost_efficiency: 0.10,
      forecast: 0.10,
      timeline_fit: 0.10,
    },
    opportunity: {
      draw_odds: 0.25,
      success_rate: 0.20,
      cost_efficiency: 0.15,
      access: 0.10,
      trophy_quality: 0.05,
      forecast: 0.10,
      personal_fit: 0.10,
      timeline_fit: 0.05,
    },
  } as Record<string, Partial<ScoringWeights>>,

  // --- Draw odds scoring adjustments ---
  drawOddsBoost: 0.15,                // Boost when user has >= min points
  deficitPenaltyPerPoint: 0.1,        // Penalty per point below minimum
  maxDeficitPenalty: 0.8,             // Cap on total deficit penalty
  drawOddsFloor: 0.05,               // Minimum draw odds score
  unknownDrawDefault: 0.8,            // Score when draw status is unknown
  noDataDrawDefault: 0.4,             // Score when no draw data exists

  // --- Trophy quality scoring ---
  meatOrientationTrophyDefault: 0.5,  // Trophy score for meat-focused hunters
  trophyBaseScore: 0.6,               // Base score when B&C score exists
  trophyBcDivisor: 1000,              // Divisor for normalizing B&C scores
  trophyDbBaseScore: 0.5,             // Base score for DB-fetched B&C scores
  trophyMinScore: 0.1,               // Minimum trophy quality score
  trophyNoScoreDefault: 0.3,         // Default when score exists but is 0
  trophyNoDataDefault: 0.4,          // Default when no trophy data exists

  // --- Success rate scoring ---
  successRateNoDataDefault: 0.35,     // Default success rate when no data

  // --- Cost efficiency thresholds ---
  defaultBudget: 5000,                // Default annual budget assumption
  costRatioTiers: [
    { maxRatio: 0.3, score: 1.0 },   // Very affordable
    { maxRatio: 0.5, score: 0.85 },
    { maxRatio: 0.75, score: 0.7 },
    { maxRatio: 1.0, score: 0.5 },
    { maxRatio: 1.25, score: 0.3 },
    { maxRatio: 1.5, score: 0.15 },  // Over budget (mild)
  ],
  wayOverBudgetScore: 0.05,           // Score when > 1.5x budget

  // --- Budget string-to-number mappings ---
  budgetMappings: {
    under_1000: 1000,
    "1000_3000": 2000,
    "3000_5000": 4000,
    "5000_10000": 7500,
    over_10000: 15000,
  } as Record<string, number>,

  // --- Access scoring ---
  accessUnknownDefault: 0.5,          // Score when public land % unknown
  publicLandTiers: [
    { minPct: 70, score: 1.0 },
    { minPct: 50, score: 0.8 },
    { minPct: 30, score: 0.6 },
    { minPct: 15, score: 0.4 },
  ],
  publicLandLowScore: 0.2,            // Score when < 15% public land

  // --- Forecast scoring (point creep trend) ---
  pointCreepThresholds: {
    risingFast: { threshold: 0.5, score: 0.2 },
    risingSlow: { threshold: 0.1, score: 0.35 },
    stable: { threshold: -0.1, score: 0.5 },
    decliningSlow: { threshold: -0.5, score: 0.65 },
    decliningFast: { score: 0.8 },
  },
  // Draw rate trend thresholds
  drawRateTrend: {
    improving: { threshold: 0.05, score: 0.75 },
    slightlyImproving: { threshold: 0, score: 0.6 },
    slightlyDeclining: { threshold: -0.05, score: 0.45 },
    declining: { score: 0.3 },
  },
  forecastNoDataDefault: 0.5,         // Score when insufficient forecast data

  // --- Personal fit scoring ---
  personalFitBaseline: 0.5,           // Starting score for personal fit
  weaponMatchBonus: 0.15,             // Bonus for matching weapon type
  weaponMismatchPenalty: -0.1,        // Penalty for no weapon match
  terrainHighAbilityAlpineBonus: 0.1, // High ability + alpine terrain
  terrainHighAbilityOtherBonus: 0.05, // High ability + other terrain
  terrainLimitedGoodMatch: 0.1,       // Limited ability + easy terrain
  terrainLimitedBadMatch: -0.1,       // Limited ability + hard terrain
  terrainModerateBonus: 0.05,         // Moderate ability + any terrain
  driveHourBonusShort: 0.1,           // Drive <= 4 hours
  driveHourBonusMedium: 0.05,         // Drive <= 8 hours
  driveHourPenaltyLong: -0.05,        // Drive > 20 hours
  diyPublicLandBonus: 0.1,            // DIY pref + > 50% public land
  diyPrivateLandPenalty: -0.05,       // DIY pref + <= 50% public land

  // --- Timeline fit scoring ---
  timelineThisYear: {
    otcScore: 1.0,
    leftoverScore: 0.9,
    highOddsThreshold: 0.5,
    highOddsScore: 0.8,
    medOddsThreshold: 0.25,
    medOddsScore: 0.5,
    lowOddsScore: 0.2,
    unknownScore: 0.4,
  },
  timelineLongTerm: {
    drawableScore: 0.9,
    closeDeficit: 3,
    closeScore: 0.8,
    medDeficit: 6,
    medScore: 0.7,
    farScore: 0.5,
    noPointsScore: 0.6,
  },
  timelineFlexible: {
    otcScore: 0.75,
    goodOddsThreshold: 0.3,
    goodOddsScore: 0.7,
    defaultScore: 0.5,
  },

  // --- Confidence assessment ---
  confidenceDataRatioWeight: 0.7,     // Weight of data ratio in confidence score
  confidenceVarianceWeight: 0.3,      // Weight of variance factor
  confidenceVarianceScale: 3,         // Multiplier for variance normalization
  confidenceHighThreshold: 0.7,       // Score >= this = high confidence
  confidenceMedThreshold: 0.4,        // Score >= this = medium confidence
  totalDataPoints: 6,                 // Total possible data points for ratio

  // --- Timeline classification ---
  timelineDrawRateThisYear: 0.3,      // Draw rate above this = this_year
  timelineCloseDeficit: 3,            // Points deficit <= this = 1-3 years
  timelineMedDeficit: 6,              // Points deficit <= this = 3-5 years

  // --- Recommendation type classification ---
  recTypeApplyNowDrawRate: 0.25,      // Min draw rate for apply_now
  recTypeApplyNowMinScore: 0.6,       // Min composite score for apply_now

  // --- Batch scoring ---
  scoringBatchSize: 20,
};

// =============================================================================
// Forecast Configuration
// =============================================================================

export const FORECAST_CONFIG = {
  // --- Data point confidence ---
  dataPointTiers: [
    { minPoints: 8, confidence: 0.35 },
    { minPoints: 5, confidence: 0.25 },
    { minPoints: 3, confidence: 0.15 },
  ],
  lowDataConfidence: 0.05,            // < 3 data points

  // --- R-squared weight ---
  r2Weight: 0.35,                     // Weight of R-squared in confidence

  // --- Year coverage confidence ---
  yearCoverageTiers: [
    { minYears: 8, confidence: 0.3 },
    { minYears: 5, confidence: 0.2 },
    { minYears: 3, confidence: 0.1 },
  ],
  lowYearConfidence: 0.05,            // < 3 years

  // --- Confidence label thresholds ---
  highConfidenceThreshold: 0.65,
  medConfidenceThreshold: 0.35,

  // --- Trend detection ---
  risingTrendThreshold: 0.15,         // slope > this = rising
  decliningTrendThreshold: -0.15,     // slope < this = declining

  // --- Projection settings ---
  projectionYears: [1, 3, 5] as readonly number[],
  uncertaintyR2Factor: 0.5,           // Multiplied by (1 - r2) * yearsAhead
  uncertaintyYearFactor: 0.3,         // Multiplied by yearsAhead

  // --- Defaults ---
  baseDrawRate: 0.1,                  // Default draw rate when unknown
  pointSurplusBoost: 0.08,            // Draw rate boost per surplus point
  maxDrawProbability: 0.95,           // Cap on draw probability
  minDrawProbability: 0.01,           // Floor on draw probability
  deficitDecayRate: 0.5,              // Exponential decay rate for deficit
  confidenceDecayPerYear: 0.12,       // Confidence loss per projection year
  confidenceFloor: 0.2,              // Minimum confidence after decay

  // --- Historical data limits ---
  maxHistoricalRecords: 15,           // Max records to fetch for point creep
  maxDrawOddsRecords: 10,             // Max records for draw odds forecast
  maxForecastRecords: 5,              // Max records for scoring forecast

  // --- Low R-squared threshold ---
  lowR2Threshold: 0.5,                // Below this adds volatility assumption
};

// =============================================================================
// Cost Configuration
// =============================================================================

export const COST_CONFIG = {
  // Default costs for unknown states
  defaultTagCost: 500,
  defaultLicenseCost: 100,
  defaultPointCost: 20,

  // Resident discounts (multiplied by cost, so 0.15 = 15% of NR price)
  residentTagMultiplier: 0.15,
  residentLicenseMultiplier: 0.25,

  // Travel cost tiers (based on drive hours)
  travelTiers: [
    { maxHours: 4, cost: 200 },       // Day trip range
    { maxHours: 10, cost: 600 },      // Drive + hotel
    { maxHours: 20, cost: 1200 },     // Long drive + multiple nights
    { maxHours: Infinity, cost: 2000 }, // Likely need to fly
  ],
  defaultTravelCost: 1000,             // When drive hours unknown

  // Gear constant
  gearCostPerTrip: 200,               // Baseline consumables per trip

  // Distance calculation
  earthRadiusMiles: 3959,
  routingFactor: 1.3,                  // Roads aren't straight lines
  averageSpeedMph: 50,

  // Budget ceiling multiplier for candidate filtering
  budgetCeilingMultiplier: 1.5,        // Allow candidates up to 1.5x budget

  // Budget string-to-ceiling mappings (for candidate generator)
  budgetCeilingMappings: {
    under_1000: 1000,
    "1000_3000": 3000,
    "3000_5000": 5000,
    "5000_10000": 10000,
    over_10000: 25000,
  } as Record<string, number>,
  defaultBudgetCeiling: 5000,

  // Candidate generator drive hour defaults
  travelToleranceHours: {
    local: 6,
    regional: 14,
    national: 30,
    fly: 999,
  } as Record<string, number>,
  defaultTravelToleranceHours: 14,

  // Public land minimum for DIY style
  diyMinPublicLandPct: 15,

  // Physical ability filters
  highElevationCutoff: 10000,          // Max elevation for limited ability

  // Timeline filter
  thisYearMinDrawRate: 0.15,           // Minimum draw rate for this_year filter
};

// =============================================================================
// Feedback Configuration
// =============================================================================

export const FEEDBACK_CONFIG = {
  // Species preference reinforcement
  speciesSaveBoost: 0.1,
  speciesDismissPenalty: -0.05,

  // State preference reinforcement
  stateSaveBoost: 0.05,
  stateDismissPenalty: -0.03,

  // Orientation reinforcement
  orientationSaveBoost: 0.08,
  orientationDismissPenalty: -0.04,

  // Budget/cost tolerance
  budgetSaveBoost: 0.05,
  budgetDismissPenalty: -0.03,

  // Timeline tolerance
  timelineSaveBoost: 0.08,
  timelineDismissPenalty: -0.05,

  // Initial behavioral preference values
  initialBaseline: 0.5,               // Starting value for new behavioral prefs
  initialConfidence: 0.5,             // Low confidence for single-signal prefs

  // Value bounds
  minValue: -1,
  maxValue: 1,
};

// =============================================================================
// DB-Driven Config Loader
// =============================================================================

// Cache for DB-loaded config overrides
let configOverrides: Record<string, unknown> | null = null;
let configLoadedAt = 0;
const CONFIG_TTL_MS = config.cache.configTtlMs;

/**
 * Load scoring config with DB overrides merged in.
 * DB values in namespace "scoring" override the defaults.
 * Results are cached for CONFIG_TTL_MS (5 minutes).
 */
export async function loadScoringConfig(): Promise<typeof SCORING_CONFIG> {
  if (configOverrides && Date.now() - configLoadedAt < CONFIG_TTL_MS) {
    return { ...SCORING_CONFIG, ...configOverrides } as typeof SCORING_CONFIG;
  }

  try {
    const rows = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.namespace, "scoring"));

    configOverrides = {};
    for (const row of rows) {
      configOverrides[row.key] = row.value;
    }
    configLoadedAt = Date.now();

    return { ...SCORING_CONFIG, ...configOverrides } as typeof SCORING_CONFIG;
  } catch {
    return SCORING_CONFIG;
  }
}
