// =============================================================================
// Profile Service — Core CRUD for Hunter Profiles
// =============================================================================

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  hunterPreferences,
  pointHoldings,
  applicationHistory,
  harvestHistory,
  states,
  species,
  huntUnits,
} from "@/lib/db/schema";

import type {
  HunterProfile,
  ProfileUpdate,
  HunterPreference,
  PreferenceInput,
  PreferenceCategory,
  PointHolding,
  PointHoldingInput,
  ApplicationRecord,
  ApplicationRecordInput,
  HarvestRecord,
  HarvestRecordInput,
  ProfileCompleteness,
  CategoryCompleteness,
} from "./types";

import { COMPLETENESS_WEIGHTS, PLAYBOOK_READY_THRESHOLD } from "./types";

const LOG_PREFIX = "[profile]";

// =============================================================================
// Inference Rules (data-driven, not if/else chains)
// =============================================================================

interface InferenceRule {
  /** Human-readable description */
  description: string;
  /** Conditions that must all be true */
  conditions: Array<{
    category: PreferenceCategory;
    key: string;
    matchValue?: unknown;
    matchAny?: unknown[];
  }>;
  /** Preferences to infer when all conditions match */
  inferences: PreferenceInput[];
}

const INFERENCE_RULES: InferenceRule[] = [
  {
    description: "Trophy elk hunters need moderate+ terrain tolerance and medium+ budget",
    conditions: [
      { category: "species_interest", key: "elk" },
      { category: "hunt_orientation", key: "orientation", matchValue: "trophy" },
    ],
    inferences: [
      { category: "physical", key: "terrain_tolerance", value: "moderate", confidence: 0.7, source: "inferred" },
      { category: "budget", key: "budget_minimum", value: "3000", confidence: 0.65, source: "inferred" },
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.75, source: "inferred" },
    ],
  },
  {
    description: "Trophy mule deer hunters likely willing to wait and need moderate budget",
    conditions: [
      { category: "species_interest", key: "mule_deer" },
      { category: "hunt_orientation", key: "orientation", matchValue: "trophy" },
    ],
    inferences: [
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.8, source: "inferred" },
      { category: "budget", key: "budget_minimum", value: "3000", confidence: 0.6, source: "inferred" },
    ],
  },
  {
    description: "Whitetail in eastern states suggests DIY and private land",
    conditions: [
      { category: "species_interest", key: "whitetail" },
    ],
    inferences: [
      { category: "hunt_style", key: "diy_preference", value: true, confidence: 0.6, source: "inferred" },
      { category: "land_access", key: "private_land_likely", value: true, confidence: 0.55, source: "inferred" },
    ],
  },
  {
    description: "This-year timeline suggests OTC and high-odds draws",
    conditions: [
      { category: "timeline", key: "timeline", matchValue: "this_year" },
    ],
    inferences: [
      { category: "hunt_style", key: "prioritize_otc", value: true, confidence: 0.8, source: "inferred" },
      { category: "hunt_style", key: "prioritize_high_odds", value: true, confidence: 0.75, source: "inferred" },
    ],
  },
  {
    description: "Budget under $1,000 suggests OTC, nearby states, DIY",
    conditions: [
      { category: "budget", key: "annual_budget", matchValue: "under_1000" },
    ],
    inferences: [
      { category: "hunt_style", key: "prioritize_otc", value: true, confidence: 0.85, source: "inferred" },
      { category: "hunt_style", key: "diy_preference", value: true, confidence: 0.7, source: "inferred" },
      { category: "travel", key: "prefer_nearby", value: true, confidence: 0.65, source: "inferred" },
    ],
  },
  {
    description: "Budget over $10,000 suggests guided hunts and fly-in willing",
    conditions: [
      { category: "budget", key: "annual_budget", matchValue: "over_10000" },
    ],
    inferences: [
      { category: "hunt_style", key: "guided_interest", value: true, confidence: 0.6, source: "inferred" },
      { category: "travel", key: "fly_willing", value: true, confidence: 0.65, source: "inferred" },
    ],
  },
  {
    description: "Local travel with archery suggests backcountry/public land",
    conditions: [
      { category: "travel", key: "travel_tolerance", matchValue: "local" },
      { category: "weapon", key: "weapon", matchAny: ["archery"] },
    ],
    inferences: [
      { category: "hunt_style", key: "diy_preference", value: true, confidence: 0.6, source: "inferred" },
    ],
  },
  {
    description: "Fly-anywhere travel suggests national scope",
    conditions: [
      { category: "travel", key: "travel_tolerance", matchValue: "fly" },
    ],
    inferences: [
      { category: "travel", key: "national_scope", value: true, confidence: 0.8, source: "inferred" },
    ],
  },
  {
    description: "High physical ability suggests backcountry is ok",
    conditions: [
      { category: "physical", key: "physical_ability", matchValue: "high" },
    ],
    inferences: [
      { category: "hunt_style", key: "backcountry_ok", value: true, confidence: 0.85, source: "inferred" },
    ],
  },
  {
    description: "Limited physical ability suggests road-accessible",
    conditions: [
      { category: "physical", key: "physical_ability", matchValue: "limited" },
    ],
    inferences: [
      { category: "hunt_style", key: "road_accessible_preferred", value: true, confidence: 0.8, source: "inferred" },
      { category: "hunt_style", key: "guided_interest", value: true, confidence: 0.5, source: "inferred" },
    ],
  },
  {
    description: "Meat-focused orientation suggests opportunity-focused approach",
    conditions: [
      { category: "hunt_orientation", key: "orientation", matchValue: "meat" },
    ],
    inferences: [
      { category: "hunt_style", key: "prioritize_otc", value: true, confidence: 0.7, source: "inferred" },
      { category: "hunt_style", key: "prioritize_high_odds", value: true, confidence: 0.8, source: "inferred" },
      { category: "timeline", key: "willing_to_wait", value: false, confidence: 0.6, source: "inferred" },
    ],
  },
  {
    description: "Long-term planners likely willing to build points",
    conditions: [
      { category: "timeline", key: "timeline", matchValue: "long_term" },
    ],
    inferences: [
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.9, source: "inferred" },
      { category: "experience", key: "point_building_interest", value: true, confidence: 0.85, source: "inferred" },
    ],
  },
];

// =============================================================================
// getProfile
// =============================================================================

export async function getProfile(userId: string): Promise<HunterProfile> {
  console.log(`${LOG_PREFIX} getProfile: ${userId}`);

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const prefs = await getPreferences(userId);
  const points = await getPointHoldings(userId);
  const completeness = calculateCompleteness(prefs);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    onboardingStep: user.onboardingStep,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    preferences: prefs,
    pointHoldings: points,
    completeness,
  };
}

// =============================================================================
// updateProfile
// =============================================================================

export async function updateProfile(
  userId: string,
  data: Partial<ProfileUpdate>
): Promise<HunterProfile> {
  console.log(`${LOG_PREFIX} updateProfile: ${userId}`, Object.keys(data));

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.onboardingStep !== undefined) updateData.onboardingStep = data.onboardingStep;
  if (data.onboardingComplete !== undefined) updateData.onboardingComplete = data.onboardingComplete;

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  return getProfile(userId);
}

// =============================================================================
// getPreferences
// =============================================================================

export async function getPreferences(userId: string): Promise<HunterPreference[]> {
  const rows = await db
    .select()
    .from(hunterPreferences)
    .where(eq(hunterPreferences.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    category: row.category as PreferenceCategory,
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    source: row.source as HunterPreference["source"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

// =============================================================================
// setPreference (single upsert)
// =============================================================================

export async function setPreference(
  userId: string,
  category: string,
  key: string,
  value: unknown,
  source: "user" | "inferred" | "behavioral" = "user"
): Promise<void> {
  console.log(`${LOG_PREFIX} setPreference: ${userId} ${category}/${key}`);

  const now = new Date();
  await db
    .insert(hunterPreferences)
    .values({
      userId,
      category,
      key,
      value,
      confidence: source === "user" ? 1.0 : 0.7,
      source,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [hunterPreferences.userId, hunterPreferences.category, hunterPreferences.key],
      set: {
        value,
        confidence: source === "user" ? 1.0 : 0.7,
        source,
        updatedAt: now,
      },
    });
}

// =============================================================================
// setPreferences (bulk upsert)
// =============================================================================

export async function setPreferences(
  userId: string,
  preferences: PreferenceInput[]
): Promise<void> {
  console.log(`${LOG_PREFIX} setPreferences: ${userId} (${preferences.length} prefs)`);

  if (preferences.length === 0) return;

  const now = new Date();

  for (const pref of preferences) {
    await db
      .insert(hunterPreferences)
      .values({
        userId,
        category: pref.category,
        key: pref.key,
        value: pref.value,
        confidence: pref.confidence ?? (pref.source === "inferred" ? 0.7 : 1.0),
        source: pref.source ?? "user",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [hunterPreferences.userId, hunterPreferences.category, hunterPreferences.key],
        set: {
          value: pref.value,
          confidence: pref.confidence ?? (pref.source === "inferred" ? 0.7 : 1.0),
          source: pref.source ?? "user",
          updatedAt: now,
        },
      });
  }
}

// =============================================================================
// getPointHoldings
// =============================================================================

export async function getPointHoldings(userId: string): Promise<PointHolding[]> {
  const rows = await db
    .select({
      id: pointHoldings.id,
      userId: pointHoldings.userId,
      stateId: pointHoldings.stateId,
      speciesId: pointHoldings.speciesId,
      stateName: states.name,
      stateCode: states.code,
      speciesName: species.commonName,
      pointType: pointHoldings.pointType,
      points: pointHoldings.points,
      yearStarted: pointHoldings.yearStarted,
      verified: pointHoldings.verified,
      createdAt: pointHoldings.createdAt,
      updatedAt: pointHoldings.updatedAt,
    })
    .from(pointHoldings)
    .innerJoin(states, eq(pointHoldings.stateId, states.id))
    .innerJoin(species, eq(pointHoldings.speciesId, species.id))
    .where(eq(pointHoldings.userId, userId));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    stateId: row.stateId,
    speciesId: row.speciesId,
    stateName: row.stateName,
    stateCode: row.stateCode,
    speciesName: row.speciesName,
    pointType: row.pointType,
    points: row.points,
    yearStarted: row.yearStarted,
    verified: row.verified,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

// =============================================================================
// setPointHoldings (bulk upsert)
// =============================================================================

export async function setPointHoldings(
  userId: string,
  holdings: PointHoldingInput[]
): Promise<void> {
  console.log(`${LOG_PREFIX} setPointHoldings: ${userId} (${holdings.length} holdings)`);

  if (holdings.length === 0) return;

  const now = new Date();

  for (const holding of holdings) {
    await db
      .insert(pointHoldings)
      .values({
        userId,
        stateId: holding.stateId,
        speciesId: holding.speciesId,
        pointType: holding.pointType,
        points: holding.points,
        yearStarted: holding.yearStarted,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          pointHoldings.userId,
          pointHoldings.stateId,
          pointHoldings.speciesId,
          pointHoldings.pointType,
        ],
        set: {
          points: holding.points,
          yearStarted: holding.yearStarted,
          updatedAt: now,
        },
      });
  }
}

// =============================================================================
// getApplicationHistory
// =============================================================================

export async function getApplicationHistory(userId: string): Promise<ApplicationRecord[]> {
  const rows = await db
    .select({
      id: applicationHistory.id,
      userId: applicationHistory.userId,
      stateId: applicationHistory.stateId,
      speciesId: applicationHistory.speciesId,
      huntUnitId: applicationHistory.huntUnitId,
      stateName: states.name,
      stateCode: states.code,
      speciesName: species.commonName,
      year: applicationHistory.year,
      choiceRank: applicationHistory.choiceRank,
      result: applicationHistory.result,
      tagType: applicationHistory.tagType,
      costPaid: applicationHistory.costPaid,
      createdAt: applicationHistory.createdAt,
    })
    .from(applicationHistory)
    .innerJoin(states, eq(applicationHistory.stateId, states.id))
    .innerJoin(species, eq(applicationHistory.speciesId, species.id))
    .where(eq(applicationHistory.userId, userId));

  // For unit names, we do a separate lookup since huntUnitId is nullable
  const unitIds = rows
    .map((r) => r.huntUnitId)
    .filter((id): id is string => id !== null);

  const unitMap = new Map<string, string>();
  if (unitIds.length > 0) {
    for (const unitId of unitIds) {
      const unit = await db.query.huntUnits.findFirst({
        where: eq(huntUnits.id, unitId),
      });
      if (unit) {
        unitMap.set(unitId, unit.unitName ?? unit.unitCode);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    stateId: row.stateId,
    speciesId: row.speciesId,
    huntUnitId: row.huntUnitId,
    stateName: row.stateName,
    stateCode: row.stateCode,
    speciesName: row.speciesName,
    unitName: row.huntUnitId ? (unitMap.get(row.huntUnitId) ?? null) : null,
    year: row.year,
    choiceRank: row.choiceRank,
    result: row.result,
    tagType: row.tagType,
    costPaid: row.costPaid,
    createdAt: row.createdAt.toISOString(),
  }));
}

// =============================================================================
// addApplicationRecord
// =============================================================================

export async function addApplicationRecord(
  userId: string,
  record: ApplicationRecordInput
): Promise<void> {
  console.log(`${LOG_PREFIX} addApplicationRecord: ${userId} year=${record.year}`);

  await db.insert(applicationHistory).values({
    userId,
    stateId: record.stateId,
    speciesId: record.speciesId,
    huntUnitId: record.huntUnitId,
    year: record.year,
    choiceRank: record.choiceRank,
    result: record.result,
    tagType: record.tagType,
    costPaid: record.costPaid,
  });
}

// =============================================================================
// getHarvestHistory
// =============================================================================

export async function getHarvestHistory(userId: string): Promise<HarvestRecord[]> {
  const rows = await db
    .select({
      id: harvestHistory.id,
      userId: harvestHistory.userId,
      stateId: harvestHistory.stateId,
      speciesId: harvestHistory.speciesId,
      huntUnitId: harvestHistory.huntUnitId,
      stateName: states.name,
      stateCode: states.code,
      speciesName: species.commonName,
      year: harvestHistory.year,
      success: harvestHistory.success,
      weaponType: harvestHistory.weaponType,
      trophyScore: harvestHistory.trophyScore,
      notes: harvestHistory.notes,
      createdAt: harvestHistory.createdAt,
    })
    .from(harvestHistory)
    .innerJoin(states, eq(harvestHistory.stateId, states.id))
    .innerJoin(species, eq(harvestHistory.speciesId, species.id))
    .where(eq(harvestHistory.userId, userId));

  // Unit name lookup for nullable huntUnitId
  const unitIds = rows
    .map((r) => r.huntUnitId)
    .filter((id): id is string => id !== null);

  const unitMap = new Map<string, string>();
  if (unitIds.length > 0) {
    for (const unitId of unitIds) {
      const unit = await db.query.huntUnits.findFirst({
        where: eq(huntUnits.id, unitId),
      });
      if (unit) {
        unitMap.set(unitId, unit.unitName ?? unit.unitCode);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    stateId: row.stateId,
    speciesId: row.speciesId,
    huntUnitId: row.huntUnitId,
    stateName: row.stateName,
    stateCode: row.stateCode,
    speciesName: row.speciesName,
    unitName: row.huntUnitId ? (unitMap.get(row.huntUnitId) ?? null) : null,
    year: row.year,
    success: row.success,
    weaponType: row.weaponType,
    trophyScore: row.trophyScore,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  }));
}

// =============================================================================
// addHarvestRecord
// =============================================================================

export async function addHarvestRecord(
  userId: string,
  record: HarvestRecordInput
): Promise<void> {
  console.log(`${LOG_PREFIX} addHarvestRecord: ${userId} year=${record.year}`);

  await db.insert(harvestHistory).values({
    userId,
    stateId: record.stateId,
    speciesId: record.speciesId,
    huntUnitId: record.huntUnitId,
    year: record.year,
    success: record.success,
    weaponType: record.weaponType,
    trophyScore: record.trophyScore,
    notes: record.notes,
  });
}

// =============================================================================
// getProfileCompleteness
// =============================================================================

export async function getProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
  const prefs = await getPreferences(userId);
  return calculateCompleteness(prefs);
}

/**
 * Calculate profile completeness from a list of preferences.
 * Pure function — no DB access.
 */
function calculateCompleteness(preferences: HunterPreference[]): ProfileCompleteness {
  const filledCategories = new Set(
    preferences
      .filter((p) => p.source === "user" || p.confidence >= 0.8)
      .map((p) => p.category)
  );

  const breakdown: CategoryCompleteness[] = [];
  let totalEarned = 0;
  let totalPossible = 0;
  const missingCategories: PreferenceCategory[] = [];

  for (const [category, config] of Object.entries(COMPLETENESS_WEIGHTS)) {
    if (config.points === 0) continue; // skip zero-weight categories like land_access

    const cat = category as PreferenceCategory;
    const filled = filledCategories.has(cat);

    breakdown.push({
      category: cat,
      label: config.label,
      maxPoints: config.points,
      earnedPoints: filled ? config.points : 0,
      filled,
    });

    totalPossible += config.points;
    if (filled) {
      totalEarned += config.points;
    } else {
      missingCategories.push(cat);
    }
  }

  const score = totalPossible > 0
    ? Math.round((totalEarned / totalPossible) * 100)
    : 0;

  return {
    score,
    breakdown,
    missingCategories,
    isPlaybookReady: score >= PLAYBOOK_READY_THRESHOLD,
  };
}

// =============================================================================
// inferPreferences
// =============================================================================

export async function inferPreferences(userId: string): Promise<void> {
  console.log(`${LOG_PREFIX} inferPreferences: ${userId}`);

  const currentPrefs = await getPreferences(userId);

  // Build a lookup: category/key → preference
  const prefLookup = new Map<string, HunterPreference>();
  for (const p of currentPrefs) {
    prefLookup.set(`${p.category}/${p.key}`, p);
  }

  const newInferences: PreferenceInput[] = [];

  for (const rule of INFERENCE_RULES) {
    // Check all conditions
    const allConditionsMet = rule.conditions.every((condition) => {
      const pref = prefLookup.get(`${condition.category}/${condition.key}`);
      if (!pref) return false;

      if (condition.matchValue !== undefined) {
        return pref.value === condition.matchValue;
      }
      if (condition.matchAny !== undefined) {
        if (Array.isArray(pref.value)) {
          return condition.matchAny.some((v) => (pref.value as unknown[]).includes(v));
        }
        return condition.matchAny.includes(pref.value);
      }
      // If no matchValue or matchAny, just check existence
      return true;
    });

    if (!allConditionsMet) continue;

    // Add inferences that don't already exist as user-stated preferences
    for (const inference of rule.inferences) {
      const existingKey = `${inference.category}/${inference.key}`;
      const existing = prefLookup.get(existingKey);

      // Never overwrite user-stated preferences
      if (existing && existing.source === "user") continue;

      // Only add if not already inferred with higher confidence
      if (
        existing &&
        existing.source === "inferred" &&
        existing.confidence >= (inference.confidence ?? 0.7)
      ) {
        continue;
      }

      newInferences.push(inference);
    }
  }

  if (newInferences.length > 0) {
    console.log(
      `${LOG_PREFIX} inferPreferences: adding ${newInferences.length} inferences for ${userId}`
    );
    await setPreferences(userId, newInferences);
  } else {
    console.log(`${LOG_PREFIX} inferPreferences: no new inferences for ${userId}`);
  }
}
