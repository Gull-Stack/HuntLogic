// =============================================================================
// Profile Service — Type Definitions
// =============================================================================

/**
 * Preference categories used throughout onboarding and profile management.
 */
export type PreferenceCategory =
  | "species_interest"
  | "hunt_orientation"
  | "timeline"
  | "budget"
  | "travel"
  | "hunt_style"
  | "weapon"
  | "physical"
  | "location"
  | "experience"
  | "land_access";

/**
 * Source of a preference value.
 */
export type PreferenceSource = "user" | "inferred" | "behavioral";

// =============================================================================
// Hunter Profile
// =============================================================================

export interface HunterProfile {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  timezone: string;
  onboardingStep: string;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: HunterPreference[];
  pointHoldings: PointHolding[];
  completeness: ProfileCompleteness;
}

export interface ProfileUpdate {
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  timezone?: string;
  onboardingStep?: string;
  onboardingComplete?: boolean;
}

// =============================================================================
// Preferences
// =============================================================================

export interface HunterPreference {
  id: string;
  userId: string;
  category: PreferenceCategory;
  key: string;
  value: unknown;
  confidence: number;
  source: PreferenceSource;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceInput {
  category: PreferenceCategory;
  key: string;
  value: unknown;
  confidence?: number;
  source?: PreferenceSource;
}

// =============================================================================
// Point Holdings
// =============================================================================

export interface PointHolding {
  id: string;
  userId: string;
  stateId: string;
  speciesId: string;
  stateName: string;
  stateCode: string;
  speciesName: string;
  pointType: string;
  points: number;
  yearStarted: number | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PointHoldingInput {
  stateId: string;
  speciesId: string;
  pointType: "preference" | "bonus" | "loyalty";
  points: number;
  yearStarted?: number;
}

// =============================================================================
// Application History
// =============================================================================

export interface ApplicationRecord {
  id: string;
  userId: string;
  stateId: string;
  speciesId: string;
  huntUnitId: string | null;
  stateName: string;
  stateCode: string;
  speciesName: string;
  unitName: string | null;
  year: number;
  choiceRank: number | null;
  result: string | null;
  tagType: string | null;
  costPaid: string | null;
  createdAt: string;
}

export interface ApplicationRecordInput {
  stateId: string;
  speciesId: string;
  huntUnitId?: string;
  year: number;
  choiceRank?: number;
  result?: string;
  tagType?: string;
  costPaid?: string;
}

// =============================================================================
// Harvest History
// =============================================================================

export interface HarvestRecord {
  id: string;
  userId: string;
  stateId: string;
  speciesId: string;
  huntUnitId: string | null;
  stateName: string;
  stateCode: string;
  speciesName: string;
  unitName: string | null;
  year: number;
  success: boolean | null;
  weaponType: string | null;
  trophyScore: string | null;
  notes: string | null;
  createdAt: string;
}

export interface HarvestRecordInput {
  stateId: string;
  speciesId: string;
  huntUnitId?: string;
  year: number;
  success?: boolean;
  weaponType?: string;
  trophyScore?: string;
  notes?: string;
}

// =============================================================================
// Profile Completeness
// =============================================================================

export interface CategoryCompleteness {
  category: PreferenceCategory;
  label: string;
  maxPoints: number;
  earnedPoints: number;
  filled: boolean;
}

export interface ProfileCompleteness {
  score: number; // 0-100
  breakdown: CategoryCompleteness[];
  missingCategories: PreferenceCategory[];
  isPlaybookReady: boolean; // score >= 60
}

/**
 * Category weights for profile completeness scoring.
 */
export const COMPLETENESS_WEIGHTS: Record<
  PreferenceCategory,
  { points: number; label: string }
> = {
  species_interest: { points: 20, label: "Species Interest" },
  hunt_orientation: { points: 15, label: "Hunt Orientation" },
  timeline: { points: 15, label: "Timeline" },
  budget: { points: 10, label: "Budget" },
  experience: { points: 10, label: "Existing Points / Experience" },
  travel: { points: 10, label: "Travel Tolerance" },
  hunt_style: { points: 5, label: "Hunt Style" },
  weapon: { points: 5, label: "Weapon Preference" },
  physical: { points: 5, label: "Physical Ability" },
  location: { points: 5, label: "Home Location" },
  land_access: { points: 0, label: "Land Access" },
};

export const PLAYBOOK_READY_THRESHOLD = 60;
