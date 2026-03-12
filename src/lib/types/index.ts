/**
 * Shared TypeScript types for HuntLogic
 */

// ============================================================================
// User types
// ============================================================================

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type SubscriptionTier = "free" | "scout" | "hunter" | "outfitter";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier;
  experienceLevel: ExperienceLevel | null;
  onboardingCompleted: boolean;
}

export interface HunterPreferences {
  targetSpecies: string[];
  targetStates: string[];
  weaponTypes: WeaponType[];
  huntStyles: string[];
  physicalFitness: string | null;
  maxTravelDistance: number | null;
  budgetRange: { min: number; max: number } | null;
  willingnessToWait: number | null;
  preferPublicLand: boolean;
}

// ============================================================================
// Hunting types
// ============================================================================

export type WeaponType = "rifle" | "archery" | "muzzleloader" | "shotgun" | "any";
export type Residency = "resident" | "nonresident";

export interface State {
  id: string;
  code: string;
  name: string;
  drawSystem: string | null;
  pointSystem: string | null;
}

export interface Species {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface HuntUnit {
  id: string;
  stateCode: string;
  code: string;
  name: string | null;
  publicLandPercent: number | null;
  elevationMin: number | null;
  elevationMax: number | null;
  centroidLat: number | null;
  centroidLng: number | null;
}

// ============================================================================
// Intelligence types
// ============================================================================

export interface DrawOddsEntry {
  year: number;
  weaponType: WeaponType;
  residency: Residency;
  totalApplicants: number | null;
  totalTags: number | null;
  drawRate: number | null;
  pointsRequired: number | null;
}

export interface HarvestStatsEntry {
  year: number;
  weaponType: WeaponType | null;
  totalHunters: number | null;
  totalHarvest: number | null;
  successRate: number | null;
}

// ============================================================================
// Recommendation types
// ============================================================================

export type ConfidenceLevel = "low" | "medium" | "high" | "very_high";
export type RecommendationStatus = "pending" | "accepted" | "dismissed" | "completed";

export interface Recommendation {
  id: string;
  stateCode: string;
  species: string;
  huntUnit: string | null;
  year: number;
  weaponType: string | null;
  confidence: ConfidenceLevel;
  estimatedDrawOdds: number | null;
  rationale: string | null;
  status: RecommendationStatus;
}

export interface Playbook {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  status: "draft" | "active" | "archived";
  strategy: PlaybookStrategy | null;
}

export interface PlaybookStrategy {
  years: Array<{
    year: number;
    applications: Array<{
      stateCode: string;
      species: string;
      unit: string;
      weaponType: string;
      priority: number;
      rationale: string;
    }>;
  }>;
}

// ============================================================================
// Action types
// ============================================================================

export type ActionStatus = "pending" | "in_progress" | "completed" | "skipped" | "overdue";
export type ActionPriority = "low" | "medium" | "high" | "urgent";

export interface UserAction {
  id: string;
  title: string;
  description: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  dueDate: string | null;
  actionUrl: string | null;
}

// ============================================================================
// API types
// ============================================================================

export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
