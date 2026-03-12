// =============================================================================
// Profile Service — Barrel Export
// =============================================================================

export {
  getProfile,
  updateProfile,
  getPreferences,
  setPreference,
  setPreferences,
  getPointHoldings,
  setPointHoldings,
  getApplicationHistory,
  addApplicationRecord,
  getHarvestHistory,
  addHarvestRecord,
  getProfileCompleteness,
  inferPreferences,
} from "./profile-service";

export type {
  HunterProfile,
  ProfileUpdate,
  HunterPreference,
  PreferenceInput,
  PreferenceCategory,
  PreferenceSource,
  PointHolding,
  PointHoldingInput,
  ApplicationRecord,
  ApplicationRecordInput,
  HarvestRecord,
  HarvestRecordInput,
  ProfileCompleteness,
  CategoryCompleteness,
} from "./types";

export { COMPLETENESS_WEIGHTS, PLAYBOOK_READY_THRESHOLD } from "./types";
