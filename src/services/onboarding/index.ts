// =============================================================================
// Onboarding Engine — Barrel Export
// =============================================================================

export {
  getNextQuestion,
  processAnswer,
  getProgress,
  skipQuestion,
  resetOnboarding,
} from "./onboarding-engine";

export {
  QUESTION_BANK,
  getQuestionById,
  getQuestionsByCategory,
  getDynamicOptions,
} from "./question-bank";

export { interpretAnswer } from "./answer-interpreter";
export { inferFromPreferences } from "./preference-inferrer";

export type {
  QuestionDefinition,
  QuestionOption,
  OnboardingQuestion,
  OnboardingAnswer,
  OnboardingResult,
  OnboardingProgress,
  InterpretedPreferences,
  ResponseType,
} from "./types";
