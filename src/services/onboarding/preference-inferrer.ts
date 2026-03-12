// =============================================================================
// Preference Inference Engine — Infers unstated preferences from stated ones
// =============================================================================

import type { HunterPreference, PreferenceInput, PreferenceCategory } from "../profile/types";

const LOG_PREFIX = "[inference]";

// =============================================================================
// Inference Rule Definitions
// =============================================================================

interface InferenceRule {
  description: string;
  conditions: Array<{
    category: PreferenceCategory;
    key: string;
    matchValue?: unknown;
    matchAny?: unknown[];
    exists?: boolean; // just check key exists
  }>;
  inferences: PreferenceInput[];
}

const INFERENCE_RULES: InferenceRule[] = [
  // Species + Orientation combos
  {
    description: "Trophy elk → moderate+ terrain, medium+ budget, willing to wait",
    conditions: [
      { category: "species_interest", key: "elk", exists: true },
      { category: "hunt_orientation", key: "orientation", matchValue: "trophy" },
    ],
    inferences: [
      { category: "physical", key: "terrain_tolerance_min", value: "moderate", confidence: 0.7, source: "inferred" },
      { category: "budget", key: "budget_minimum", value: "3000", confidence: 0.65, source: "inferred" },
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.75, source: "inferred" },
    ],
  },
  {
    description: "Trophy mule deer → willing to wait, medium budget",
    conditions: [
      { category: "species_interest", key: "mule_deer", exists: true },
      { category: "hunt_orientation", key: "orientation", matchValue: "trophy" },
    ],
    inferences: [
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.8, source: "inferred" },
      { category: "budget", key: "budget_minimum", value: "3000", confidence: 0.6, source: "inferred" },
    ],
  },
  {
    description: "Whitetail interest → likely DIY, likely private land",
    conditions: [
      { category: "species_interest", key: "whitetail", exists: true },
    ],
    inferences: [
      { category: "hunt_style", key: "diy_preference", value: true, confidence: 0.6, source: "inferred" },
      { category: "land_access", key: "private_land_likely", value: true, confidence: 0.55, source: "inferred" },
    ],
  },
  {
    description: "Bighorn sheep or mountain goat → high physical, big budget, long wait",
    conditions: [
      { category: "species_interest", key: "bighorn_sheep", exists: true },
    ],
    inferences: [
      { category: "physical", key: "terrain_tolerance_min", value: "high", confidence: 0.8, source: "inferred" },
      { category: "budget", key: "budget_minimum", value: "5000", confidence: 0.7, source: "inferred" },
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.9, source: "inferred" },
    ],
  },
  {
    description: "Mountain goat → high physical, big budget, long wait",
    conditions: [
      { category: "species_interest", key: "mountain_goat", exists: true },
    ],
    inferences: [
      { category: "physical", key: "terrain_tolerance_min", value: "high", confidence: 0.8, source: "inferred" },
      { category: "budget", key: "budget_minimum", value: "5000", confidence: 0.7, source: "inferred" },
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.85, source: "inferred" },
    ],
  },

  // Timeline inferences
  {
    description: "This-year timeline → prioritize OTC and high-odds draws",
    conditions: [
      { category: "timeline", key: "timeline", matchValue: "this_year" },
    ],
    inferences: [
      { category: "hunt_style", key: "prioritize_otc", value: true, confidence: 0.8, source: "inferred" },
      { category: "hunt_style", key: "prioritize_high_odds", value: true, confidence: 0.75, source: "inferred" },
    ],
  },
  {
    description: "Long-term timeline → willing to build points",
    conditions: [
      { category: "timeline", key: "timeline", matchValue: "long_term" },
    ],
    inferences: [
      { category: "timeline", key: "willing_to_wait", value: true, confidence: 0.9, source: "inferred" },
      { category: "experience", key: "point_building_interest", value: true, confidence: 0.85, source: "inferred" },
    ],
  },

  // Budget inferences
  {
    description: "Budget under $1,000 → OTC, nearby states, DIY",
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
    description: "Budget over $10,000 → open to guided, willing to fly",
    conditions: [
      { category: "budget", key: "annual_budget", matchValue: "over_10000" },
    ],
    inferences: [
      { category: "hunt_style", key: "guided_interest", value: true, confidence: 0.6, source: "inferred" },
      { category: "travel", key: "fly_willing", value: true, confidence: 0.65, source: "inferred" },
    ],
  },

  // Travel inferences
  {
    description: "Fly-anywhere travel → national scope",
    conditions: [
      { category: "travel", key: "travel_tolerance", matchValue: "fly" },
    ],
    inferences: [
      { category: "travel", key: "national_scope", value: true, confidence: 0.8, source: "inferred" },
    ],
  },
  {
    description: "Local travel → nearby states only",
    conditions: [
      { category: "travel", key: "travel_tolerance", matchValue: "local" },
    ],
    inferences: [
      { category: "travel", key: "prefer_nearby", value: true, confidence: 0.85, source: "inferred" },
    ],
  },

  // Physical ability inferences
  {
    description: "High physical ability → backcountry ok",
    conditions: [
      { category: "physical", key: "physical_ability", matchValue: "high" },
    ],
    inferences: [
      { category: "hunt_style", key: "backcountry_ok", value: true, confidence: 0.85, source: "inferred" },
    ],
  },
  {
    description: "Limited physical ability → road-accessible, possibly guided",
    conditions: [
      { category: "physical", key: "physical_ability", matchValue: "limited" },
    ],
    inferences: [
      { category: "hunt_style", key: "road_accessible_preferred", value: true, confidence: 0.8, source: "inferred" },
      { category: "hunt_style", key: "guided_interest", value: true, confidence: 0.5, source: "inferred" },
    ],
  },

  // Orientation inferences
  {
    description: "Meat-focused orientation → opportunity hunting approach",
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
    description: "Experience-focused orientation → flexible approach",
    conditions: [
      { category: "hunt_orientation", key: "orientation", matchValue: "experience" },
    ],
    inferences: [
      { category: "hunt_style", key: "experience_focused", value: true, confidence: 0.8, source: "inferred" },
      { category: "travel", key: "variety_seeking", value: true, confidence: 0.6, source: "inferred" },
    ],
  },

  // Weapon + style combos
  {
    description: "Archery + local travel → likely public land DIY",
    conditions: [
      { category: "weapon", key: "archery", exists: true },
      { category: "travel", key: "travel_tolerance", matchAny: ["local", "regional"] },
    ],
    inferences: [
      { category: "hunt_style", key: "diy_preference", value: true, confidence: 0.6, source: "inferred" },
    ],
  },
];

// =============================================================================
// inferFromPreferences
// =============================================================================

/**
 * Given a list of current preferences, returns NEW inferences that don't
 * overwrite user-stated preferences.
 */
export function inferFromPreferences(
  preferences: HunterPreference[]
): PreferenceInput[] {
  // Build lookup: category/key → preference
  const prefLookup = new Map<string, HunterPreference>();
  for (const p of preferences) {
    prefLookup.set(`${p.category}/${p.key}`, p);
  }

  const newInferences: PreferenceInput[] = [];
  const seenKeys = new Set<string>();

  for (const rule of INFERENCE_RULES) {
    // Check all conditions
    const allMet = rule.conditions.every((cond) => {
      const key = `${cond.category}/${cond.key}`;
      const pref = prefLookup.get(key);

      if (cond.exists) {
        return pref !== undefined;
      }

      if (!pref) return false;

      if (cond.matchValue !== undefined) {
        return pref.value === cond.matchValue;
      }

      if (cond.matchAny !== undefined) {
        if (Array.isArray(pref.value)) {
          return cond.matchAny.some((v) => (pref.value as unknown[]).includes(v));
        }
        return cond.matchAny.includes(pref.value);
      }

      return true;
    });

    if (!allMet) continue;

    console.log(`${LOG_PREFIX} Rule matched: ${rule.description}`);

    // Add inferences that don't conflict with user-stated preferences
    for (const inference of rule.inferences) {
      const inferenceKey = `${inference.category}/${inference.key}`;

      // Skip if already processed in this run (highest-weight rule wins)
      if (seenKeys.has(inferenceKey)) continue;

      const existing = prefLookup.get(inferenceKey);

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

      seenKeys.add(inferenceKey);
      newInferences.push(inference);
    }
  }

  console.log(`${LOG_PREFIX} Generated ${newInferences.length} inferences`);
  return newInferences;
}
