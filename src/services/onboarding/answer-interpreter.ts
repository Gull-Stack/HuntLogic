// =============================================================================
// Answer Interpreter — AI-powered interpretation of user answers
// =============================================================================

import { sendMessage } from "@/lib/ai/client";
import type { QuestionDefinition, OnboardingAnswer, InterpretedPreferences } from "./types";
import type { HunterProfile, PreferenceInput, PreferenceCategory } from "../profile/types";

const LOG_PREFIX = "[onboarding]";

// =============================================================================
// interpretAnswer
// =============================================================================

/**
 * Interpret a user's answer to an onboarding question and extract
 * structured preferences. For structured responses (single_select,
 * multi_select), this is direct mapping. For free-text, Claude extracts
 * the preferences.
 */
export async function interpretAnswer(
  question: QuestionDefinition,
  answer: OnboardingAnswer,
  currentProfile: HunterProfile
): Promise<InterpretedPreferences> {
  console.log(
    `${LOG_PREFIX} interpretAnswer: question=${question.id} type=${answer.responseType}`
  );

  // Direct mapping for structured responses
  if (
    answer.responseType === "single_select" &&
    answer.selectedValues &&
    answer.selectedValues.length > 0
  ) {
    return interpretSingleSelect(question, answer.selectedValues[0]!);
  }

  if (
    answer.responseType === "multi_select" &&
    answer.selectedValues &&
    answer.selectedValues.length > 0
  ) {
    return interpretMultiSelect(question, answer.selectedValues);
  }

  if (answer.responseType === "structured" && answer.structured) {
    return interpretStructured(question, answer.structured);
  }

  // Free-text response — use Claude to interpret
  if (answer.freeText) {
    return interpretFreeText(question, answer.freeText, currentProfile);
  }

  // Fallback: no useful data
  return {
    preferences: [],
    confidence: 0,
    notes: "No interpretable answer data provided",
  };
}

// =============================================================================
// Single Select Interpretation
// =============================================================================

function interpretSingleSelect(
  question: QuestionDefinition,
  selectedValue: string
): InterpretedPreferences {
  const keyMap: Record<string, string> = {
    species_interest: "species",
    hunt_orientation: "orientation",
    timeline: "timeline",
    budget: "annual_budget",
    travel: "travel_tolerance",
    hunt_style: "style",
    weapon: "weapon",
    physical: "physical_ability",
    location: "home_state",
    experience: "experience_level",
    land_access: "land_access",
  };

  const key = keyMap[question.category] ?? question.category;

  return {
    preferences: [
      {
        category: question.category,
        key,
        value: selectedValue,
        confidence: 1.0,
        source: "user",
      },
    ],
    confidence: 1.0,
    notes: `Direct single-select: ${question.category}=${selectedValue}`,
  };
}

// =============================================================================
// Multi Select Interpretation
// =============================================================================

function interpretMultiSelect(
  question: QuestionDefinition,
  selectedValues: string[]
): InterpretedPreferences {
  const preferences: PreferenceInput[] = selectedValues.map((value) => ({
    category: question.category,
    key: value,
    value: true,
    confidence: 1.0,
    source: "user" as const,
  }));

  return {
    preferences,
    confidence: 1.0,
    notes: `Direct multi-select: ${question.category}=[${selectedValues.join(", ")}]`,
  };
}

// =============================================================================
// Structured Interpretation (e.g., point holdings by state)
// =============================================================================

function interpretStructured(
  question: QuestionDefinition,
  structured: Record<string, unknown>
): InterpretedPreferences {
  const preferences: PreferenceInput[] = [];

  // For point holdings, the structured data looks like:
  // { "CO": { "elk": 3, "mule_deer": 2 }, "WY": { "elk": 5 } }
  if (question.id === "existing_points") {
    for (const [stateCode, speciesPoints] of Object.entries(structured)) {
      if (typeof speciesPoints === "object" && speciesPoints !== null) {
        for (const [speciesSlug, points] of Object.entries(
          speciesPoints as Record<string, unknown>
        )) {
          preferences.push({
            category: "experience",
            key: `points_${stateCode}_${speciesSlug}`,
            value: { state: stateCode, species: speciesSlug, points },
            confidence: 1.0,
            source: "user",
          });
        }
      }
    }

    // Also mark the experience category as having been answered
    if (preferences.length > 0) {
      preferences.push({
        category: "experience",
        key: "has_points",
        value: true,
        confidence: 1.0,
        source: "user",
      });
    } else {
      preferences.push({
        category: "experience",
        key: "has_points",
        value: false,
        confidence: 1.0,
        source: "user",
      });
    }
  }

  return {
    preferences,
    confidence: 1.0,
    notes: `Structured interpretation for ${question.id}`,
  };
}

// =============================================================================
// Free Text Interpretation (uses Claude)
// =============================================================================

async function interpretFreeText(
  question: QuestionDefinition,
  freeText: string,
  currentProfile: HunterProfile
): Promise<InterpretedPreferences> {
  console.log(`${LOG_PREFIX} interpretFreeText: calling Claude for question=${question.id}`);

  const systemPrompt = `You are a hunting data extraction assistant. Given a hunter's free-text response to a question, extract structured preferences. Return JSON with an array of {category, key, value, confidence} objects. Only extract what is clearly stated or strongly implied. Be conservative.

Valid categories: species_interest, hunt_orientation, timeline, budget, travel, hunt_style, weapon, physical, location, experience, land_access

Examples:
- "I've been chasing elk in Colorado for 5 years with a bow, have 3 preference points" ->
  [
    {"category": "species_interest", "key": "elk", "value": true, "confidence": 1.0},
    {"category": "location", "key": "target_state", "value": "CO", "confidence": 0.9},
    {"category": "weapon", "key": "archery", "value": true, "confidence": 1.0},
    {"category": "experience", "key": "points_CO_elk", "value": {"state": "CO", "species": "elk", "points": 3}, "confidence": 1.0},
    {"category": "experience", "key": "years_hunting", "value": 5, "confidence": 0.9}
  ]

- "I want to hunt elk and mule deer" ->
  [
    {"category": "species_interest", "key": "elk", "value": true, "confidence": 1.0},
    {"category": "species_interest", "key": "mule_deer", "value": true, "confidence": 1.0}
  ]

Return ONLY valid JSON in this format:
{"preferences": [...], "confidence": 0.X, "notes": "brief explanation"}`;

  const profileSummary = summarizeProfile(currentProfile);

  const userMessage = `Question asked: ${question.id} (category: ${question.category})
Current profile: ${profileSummary}

Hunter's response: "${freeText}"

Extract structured preferences from this response. Return ONLY valid JSON.`;

  try {
    const response = await sendMessage({
      messages: [{ role: "user", content: userMessage }],
      systemPrompt,
      maxTokens: 1024,
      temperature: 0.3,
    });

    const firstBlock = response.content[0];
    const responseText =
      firstBlock && firstBlock.type === "text" ? firstBlock.text : "";

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(`${LOG_PREFIX} interpretFreeText: no JSON found in Claude response`);
      return {
        preferences: [],
        confidence: 0,
        notes: "Failed to parse AI interpretation",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      preferences: Array<{
        category: string;
        key: string;
        value: unknown;
        confidence: number;
      }>;
      confidence: number;
      notes: string;
    };

    const preferences: PreferenceInput[] = parsed.preferences.map((p) => ({
      category: p.category as PreferenceCategory,
      key: p.key,
      value: p.value,
      confidence: p.confidence,
      source: "user" as const,
    }));

    return {
      preferences,
      confidence: parsed.confidence,
      notes: parsed.notes,
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} interpretFreeText: Claude call failed`, error);
    return {
      preferences: [],
      confidence: 0,
      notes: `AI interpretation failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

// =============================================================================
// Helpers
// =============================================================================

function summarizeProfile(profile: HunterProfile): string {
  const parts: string[] = [];

  if (profile.displayName) parts.push(`Name: ${profile.displayName}`);

  const userPrefs = profile.preferences.filter((p) => p.source === "user");
  if (userPrefs.length > 0) {
    const byCat = new Map<string, string[]>();
    for (const p of userPrefs) {
      if (!byCat.has(p.category)) byCat.set(p.category, []);
      byCat.get(p.category)!.push(`${p.key}=${JSON.stringify(p.value)}`);
    }
    for (const [cat, items] of byCat) {
      parts.push(`${cat}: ${items.join(", ")}`);
    }
  } else {
    parts.push("No preferences set yet");
  }

  if (profile.pointHoldings.length > 0) {
    const pointsSummary = profile.pointHoldings
      .map((p) => `${p.stateCode} ${p.speciesName} ${p.pointType}: ${p.points}`)
      .join("; ");
    parts.push(`Points: ${pointsSummary}`);
  }

  return parts.join(" | ");
}
