// =============================================================================
// Onboarding Question Bank — All possible questions the system can ask
// =============================================================================

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { states, species } from "@/lib/db/schema";

import type { QuestionDefinition, QuestionOption } from "./types";

const SPECIES_OPTION_OVERRIDES: Record<string, { label: string; description?: string }> = {
  pheasant: { label: "Upland Birds", description: "Pheasant, quail, grouse, chukar, and other upland birds" },
  upland_birds: { label: "Upland Birds", description: "Pheasant, quail, grouse, chukar, and other upland birds" },
  waterfowl: { label: "Waterfowl (Ducks & Geese)", description: "Ducks, geese, and other migratory waterfowl" },
  small_game: { label: "Small Game", description: "Rabbit, squirrel, and other small game" },
  predators: { label: "Predators", description: "Wolf, coyote, fox, bobcat, and other predators" },
  brown_bear: { label: "Brown Bear", description: "Coastal brown/grizzly bear opportunities" },
  hogs: { label: "Hogs", description: "Wild pigs and feral hogs" },
  furbearer: { label: "Furbearer", description: "Trapping and furbearer species" },
};

// =============================================================================
// Question Definitions
// =============================================================================

export const QUESTION_BANK: QuestionDefinition[] = [
  {
    id: "species_interest",
    category: "species_interest",
    weight: 1.0,
    promptSlug: "onboarding_species",
    responseType: "multi_select",
    options: "dynamic", // loaded from species table
    followUp: true,
  },
  {
    id: "hunt_orientation",
    category: "hunt_orientation",
    weight: 0.95,
    promptSlug: "onboarding_orientation",
    responseType: "single_select",
    options: [
      { value: "meat", label: "Fill the freezer -- I want to eat well" },
      { value: "trophy", label: "Trophy quality -- I want a wall-hanger" },
      { value: "both", label: "Both -- mix of opportunity and trophy" },
      { value: "experience", label: "The experience -- I just want to be out there" },
    ],
  },
  {
    id: "timeline",
    category: "timeline",
    weight: 0.9,
    promptSlug: "onboarding_timeline",
    responseType: "single_select",
    options: [
      { value: "this_year", label: "This year -- I want to hunt ASAP" },
      { value: "1_to_3_years", label: "1-3 years -- near-term planning" },
      { value: "3_to_5_years", label: "3-5 years -- willing to wait" },
      { value: "long_term", label: "Long-term -- building a 5+ year strategy" },
      { value: "mix", label: "Mix -- some hunts soon, some long-term" },
    ],
  },
  {
    id: "budget",
    category: "budget",
    weight: 0.85,
    promptSlug: "onboarding_budget",
    responseType: "single_select",
    options: [
      { value: "under_1000", label: "Under $1,000/year" },
      { value: "1000_to_3000", label: "$1,000 - $3,000/year" },
      { value: "3000_to_5000", label: "$3,000 - $5,000/year" },
      { value: "5000_to_10000", label: "$5,000 - $10,000/year" },
      { value: "over_10000", label: "$10,000+/year" },
    ],
  },
  {
    id: "existing_points",
    category: "experience",
    weight: 0.8,
    promptSlug: "onboarding_points",
    responseType: "structured", // special UI for entering points by state
    options: "dynamic", // states with point systems
  },
  {
    id: "travel_tolerance",
    category: "travel",
    weight: 0.75,
    promptSlug: "onboarding_travel",
    responseType: "single_select",
    options: [
      { value: "local", label: "Stay close to home (driving distance)" },
      { value: "regional", label: "Regional -- willing to drive 6-10 hours" },
      { value: "national_drive", label: "Anywhere I can drive to" },
      { value: "fly", label: "Will fly anywhere in the US" },
    ],
  },
  {
    id: "hunt_style",
    category: "hunt_style",
    weight: 0.7,
    promptSlug: "onboarding_style",
    responseType: "multi_select",
    options: [
      { value: "diy_public", label: "DIY on public land" },
      { value: "diy_private", label: "DIY with private land access" },
      { value: "guided", label: "Guided/outfitted hunts" },
      { value: "semi_guided", label: "Semi-guided (drop camps, etc.)" },
    ],
  },
  {
    id: "home_state",
    category: "location",
    weight: 0.65,
    promptSlug: "onboarding_location",
    responseType: "single_select",
    options: "dynamic", // loaded from states table
  },
  {
    id: "weapon_preference",
    category: "weapon",
    weight: 0.6,
    promptSlug: "onboarding_weapon",
    responseType: "multi_select",
    options: [
      { value: "rifle", label: "Rifle" },
      { value: "archery", label: "Archery" },
      { value: "muzzleloader", label: "Muzzleloader" },
      { value: "shotgun", label: "Shotgun" },
      { value: "any", label: "Any weapon -- no preference" },
    ],
  },
  {
    id: "physical_ability",
    category: "physical",
    weight: 0.55,
    promptSlug: "onboarding_physical",
    responseType: "single_select",
    options: [
      { value: "high", label: "Very fit -- backcountry, high altitude, no problem" },
      { value: "moderate", label: "Moderate -- can handle moderate terrain and elevation" },
      { value: "limited", label: "Limited -- prefer road-accessible or easy terrain" },
    ],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getQuestionById(id: string): QuestionDefinition | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

export function getQuestionsByCategory(category: string): QuestionDefinition[] {
  return QUESTION_BANK.filter((q) => q.category === category);
}

/**
 * Load dynamic options for questions that have options: 'dynamic'.
 * Fetches species or states from the database.
 */
export async function getDynamicOptions(questionId: string): Promise<QuestionOption[]> {
  switch (questionId) {
    case "species_interest": {
      const allSpecies = await db
        .select({
          slug: species.slug,
          commonName: species.commonName,
          category: species.category,
        })
        .from(species)
        .where(eq(species.enabled, true));

      return allSpecies.map((s) => ({
        value: s.slug,
        label: SPECIES_OPTION_OVERRIDES[s.slug]?.label ?? s.commonName,
        description:
          SPECIES_OPTION_OVERRIDES[s.slug]?.description ?? s.category ?? undefined,
      }));
    }

    case "home_state": {
      const allStates = await db
        .select({
          code: states.code,
          name: states.name,
        })
        .from(states)
        .where(eq(states.enabled, true));

      return allStates.map((s) => ({
        value: s.code,
        label: s.name,
      }));
    }

    case "existing_points": {
      // Return states that have point systems
      const pointStates = await db
        .select({
          code: states.code,
          name: states.name,
        })
        .from(states)
        .where(eq(states.hasPointSystem, true));

      return pointStates.map((s) => ({
        value: s.code,
        label: s.name,
        description: "Has preference/bonus point system",
      }));
    }

    default:
      return [];
  }
}
