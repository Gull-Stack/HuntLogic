// =============================================================================
// Onboarding Engine — Type Definitions
// =============================================================================

import type { PreferenceCategory, PreferenceInput } from "../profile/types";

// =============================================================================
// Question Definitions
// =============================================================================

export type ResponseType = "single_select" | "multi_select" | "structured" | "free_text";

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionDefinition {
  id: string;
  category: PreferenceCategory;
  weight: number;
  promptSlug: string; // references ai_prompts table
  responseType: ResponseType;
  options: QuestionOption[] | "dynamic"; // static options or loaded from DB
  followUp?: boolean; // may trigger follow-up questions
}

// =============================================================================
// Onboarding Question (generated, sent to client)
// =============================================================================

export interface OnboardingQuestion {
  questionId: string;
  category: PreferenceCategory;
  text: string; // AI-generated conversational question text
  options: QuestionOption[];
  responseType: ResponseType;
  canSkip: boolean;
  metadata: {
    weight: number;
    promptSlug: string;
    estimatedRemainingQuestions: number;
  };
}

// =============================================================================
// Onboarding Answer (received from client)
// =============================================================================

export interface OnboardingAnswer {
  questionId: string;
  responseType: ResponseType;
  selectedValues?: string[];
  freeText?: string;
  structured?: Record<string, unknown>;
}

// =============================================================================
// Onboarding Result (response after processing an answer)
// =============================================================================

export interface OnboardingResult {
  completeness: number; // 0-100
  isPlaybookReady: boolean;
  preferencesSet: PreferenceInput[];
  nextQuestionPreview: {
    questionId: string;
    category: PreferenceCategory;
  } | null;
}

// =============================================================================
// Onboarding Progress
// =============================================================================

export interface OnboardingProgress {
  completenessScore: number;
  categoriesCompleted: PreferenceCategory[];
  categoriesRemaining: PreferenceCategory[];
  isPlaybookReady: boolean;
  estimatedQuestionsRemaining: number;
}

// =============================================================================
// Interpreted Preferences (from AI answer interpretation)
// =============================================================================

export interface InterpretedPreferences {
  preferences: PreferenceInput[];
  confidence: number;
  notes: string;
}
