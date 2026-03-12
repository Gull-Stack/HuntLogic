// =============================================================================
// Onboarding Engine — Adaptive question flow powered by Claude AI
// =============================================================================

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiPrompts, hunterPreferences, users } from "@/lib/db/schema";
import { sendMessage } from "@/lib/ai/client";
import { interpolatePrompt } from "@/lib/ai/prompts";

import {
  getProfile,
  getPreferences,
  setPreferences,
  getProfileCompleteness,
} from "../profile/profile-service";
import { COMPLETENESS_WEIGHTS } from "../profile/types";
import type { PreferenceCategory, HunterProfile } from "../profile/types";

import { QUESTION_BANK, getQuestionById, getDynamicOptions } from "./question-bank";
import { interpretAnswer } from "./answer-interpreter";
import { inferFromPreferences } from "./preference-inferrer";

import type {
  OnboardingQuestion,
  OnboardingAnswer,
  OnboardingResult,
  OnboardingProgress,
  QuestionOption,
} from "./types";

const LOG_PREFIX = "[onboarding]";

// =============================================================================
// getNextQuestion
// =============================================================================

/**
 * Determines the highest-value next question to ask the hunter.
 * Returns null if the profile is playbook-ready (completeness >= 60).
 */
export async function getNextQuestion(
  userId: string
): Promise<OnboardingQuestion | null> {
  console.log(`${LOG_PREFIX} getNextQuestion: ${userId}`);

  // 1. Load current profile completeness
  const profile = await getProfile(userId);
  const { completeness } = profile;

  // 2. If playbook_ready, return null (done)
  if (completeness.isPlaybookReady) {
    console.log(
      `${LOG_PREFIX} Profile is playbook-ready (score=${completeness.score}), no more questions`
    );
    return null;
  }

  // 3. Calculate information gain for each possible question category
  const currentPrefs = profile.preferences;
  const answeredCategories = new Set(
    currentPrefs.filter((p) => p.source === "user").map((p) => p.category)
  );

  // Also track skipped categories
  const skippedCategories = new Set(
    currentPrefs
      .filter((p) => p.key === "__skipped" && p.source === "user")
      .map((p) => p.category)
  );

  // 4. Weight by: category importance * (1 - current confidence for that category)
  const candidates = QUESTION_BANK
    .filter((q) => {
      // Skip already answered or skipped categories
      return (
        !answeredCategories.has(q.category) &&
        !skippedCategories.has(q.category)
      );
    })
    .map((q) => {
      const categoryWeight =
        COMPLETENESS_WEIGHTS[q.category]?.points ?? 0;

      // Find any existing inferred confidence for this category
      const existingInferred = currentPrefs.find(
        (p) => p.category === q.category && p.source === "inferred"
      );
      const currentConfidence = existingInferred
        ? existingInferred.confidence
        : 0;

      const informationGain = categoryWeight * (1 - currentConfidence);

      return {
        question: q,
        informationGain,
        categoryWeight,
      };
    })
    .filter((c) => c.categoryWeight > 0) // skip zero-weight categories
    .sort((a, b) => b.informationGain - a.informationGain);

  if (candidates.length === 0) {
    console.log(`${LOG_PREFIX} No more questions available`);
    return null;
  }

  // 5. Pick highest weighted unanswered category
  const bestCandidate = candidates[0]!;
  const questionDef = bestCandidate.question;

  // 6. Load the AI prompt template for that category from DB
  let questionText: string;
  let options: QuestionOption[];

  try {
    const prompt = await db.query.aiPrompts.findFirst({
      where: and(
        eq(aiPrompts.slug, questionDef.promptSlug),
        eq(aiPrompts.active, true)
      ),
    });

    // Build a profile summary for the prompt
    const profileSummary = buildProfileSummary(profile);

    if (prompt) {
      // 7. Call Claude to generate a natural, conversational question
      const interpolated = interpolatePrompt(prompt.template, {
        display_name: profile.displayName ?? "friend",
        profile_summary: profileSummary,
        species_interests: profile.preferences
          .filter((p) => p.category === "species_interest" && p.source === "user")
          .map((p) => p.key)
          .join(", ") || "not yet specified",
      });

      const response = await sendMessage({
        messages: [{ role: "user", content: "Generate the onboarding question now." }],
        systemPrompt: interpolated,
        model: prompt.model ?? undefined,
        maxTokens: prompt.maxTokens ?? 512,
        temperature: prompt.temperature ?? 0.7,
      });

      const firstBlock = response.content[0];
      questionText =
        firstBlock && firstBlock.type === "text"
          ? firstBlock.text
          : "What can you tell me about your hunting preferences?";
    } else {
      // Fallback if prompt not found in DB
      console.log(
        `${LOG_PREFIX} Prompt ${questionDef.promptSlug} not found in DB, using fallback`
      );
      questionText = getFallbackQuestionText(questionDef.id);
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error generating question text:`, error);
    questionText = getFallbackQuestionText(questionDef.id);
  }

  // Load dynamic options if needed
  if (questionDef.options === "dynamic") {
    options = await getDynamicOptions(questionDef.id);
  } else {
    options = questionDef.options;
  }

  // Calculate estimated remaining questions
  const remainingCategories = candidates.length;

  return {
    questionId: questionDef.id,
    category: questionDef.category,
    text: questionText,
    options,
    responseType: questionDef.responseType,
    canSkip: true,
    metadata: {
      weight: questionDef.weight,
      promptSlug: questionDef.promptSlug,
      estimatedRemainingQuestions: remainingCategories,
    },
  };
}

// =============================================================================
// processAnswer
// =============================================================================

/**
 * Process a user's answer to an onboarding question:
 * 1. Parse and interpret the answer
 * 2. Extract preferences
 * 3. Save to DB
 * 4. Run inference
 * 5. Return updated state
 */
export async function processAnswer(
  userId: string,
  questionId: string,
  answer: OnboardingAnswer
): Promise<OnboardingResult> {
  console.log(`${LOG_PREFIX} processAnswer: user=${userId} question=${questionId}`);

  // 1. Get the question definition
  const questionDef = getQuestionById(questionId);
  if (!questionDef) {
    throw new Error(`Unknown question ID: ${questionId}`);
  }

  // 2. Load current profile
  const profile = await getProfile(userId);

  // 3. Interpret the answer into structured preferences
  const interpreted = await interpretAnswer(questionDef, answer, profile);
  console.log(
    `${LOG_PREFIX} Interpreted ${interpreted.preferences.length} preferences (confidence=${interpreted.confidence})`
  );

  // 4. Save preferences to DB
  if (interpreted.preferences.length > 0) {
    await setPreferences(userId, interpreted.preferences);
  }

  // 5. Run preference inference
  const updatedPrefs = await getPreferences(userId);
  const newInferences = inferFromPreferences(
    updatedPrefs.map((p) => ({
      ...p,
      value: p.value,
    }))
  );

  if (newInferences.length > 0) {
    await setPreferences(userId, newInferences);
  }

  // 6. Calculate new completeness
  const newCompleteness = await getProfileCompleteness(userId);

  // 7. Get next question preview (lightweight — just the ID and category)
  let nextQuestionPreview: OnboardingResult["nextQuestionPreview"] = null;
  if (!newCompleteness.isPlaybookReady) {
    // Quick peek at next question without generating AI text
    const updatedProfile = await getProfile(userId);
    const answeredCats = new Set(
      updatedProfile.preferences
        .filter((p) => p.source === "user")
        .map((p) => p.category)
    );

    const nextCandidate = QUESTION_BANK
      .filter((q) => !answeredCats.has(q.category))
      .filter((q) => (COMPLETENESS_WEIGHTS[q.category]?.points ?? 0) > 0)
      .sort((a, b) => b.weight - a.weight)[0];

    if (nextCandidate) {
      nextQuestionPreview = {
        questionId: nextCandidate.id,
        category: nextCandidate.category,
      };
    }
  }

  return {
    completeness: newCompleteness.score,
    isPlaybookReady: newCompleteness.isPlaybookReady,
    preferencesSet: interpreted.preferences,
    nextQuestionPreview,
  };
}

// =============================================================================
// getProgress
// =============================================================================

export async function getProgress(userId: string): Promise<OnboardingProgress> {
  console.log(`${LOG_PREFIX} getProgress: ${userId}`);

  const completeness = await getProfileCompleteness(userId);
  const prefs = await getPreferences(userId);

  const answeredCategories = [
    ...new Set(prefs.filter((p) => p.source === "user").map((p) => p.category)),
  ] as PreferenceCategory[];

  const allCategories = Object.entries(COMPLETENESS_WEIGHTS)
    .filter(([, config]) => config.points > 0)
    .map(([cat]) => cat as PreferenceCategory);

  const categoriesRemaining = allCategories.filter(
    (cat) => !answeredCategories.includes(cat)
  );

  return {
    completenessScore: completeness.score,
    categoriesCompleted: answeredCategories,
    categoriesRemaining,
    isPlaybookReady: completeness.isPlaybookReady,
    estimatedQuestionsRemaining: categoriesRemaining.length,
  };
}

// =============================================================================
// skipQuestion
// =============================================================================

export async function skipQuestion(
  userId: string,
  questionId: string
): Promise<OnboardingResult> {
  console.log(`${LOG_PREFIX} skipQuestion: user=${userId} question=${questionId}`);

  const questionDef = getQuestionById(questionId);
  if (!questionDef) {
    throw new Error(`Unknown question ID: ${questionId}`);
  }

  // Mark category as skipped
  await setPreferences(userId, [
    {
      category: questionDef.category,
      key: "__skipped",
      value: true,
      confidence: 1.0,
      source: "user",
    },
  ]);

  // Calculate new completeness
  const newCompleteness = await getProfileCompleteness(userId);

  // Get next question preview
  let nextQuestionPreview: OnboardingResult["nextQuestionPreview"] = null;
  if (!newCompleteness.isPlaybookReady) {
    const profile = await getProfile(userId);
    const answeredCats = new Set(
      profile.preferences
        .filter((p) => p.source === "user")
        .map((p) => p.category)
    );

    const nextCandidate = QUESTION_BANK
      .filter((q) => !answeredCats.has(q.category))
      .filter((q) => (COMPLETENESS_WEIGHTS[q.category]?.points ?? 0) > 0)
      .sort((a, b) => b.weight - a.weight)[0];

    if (nextCandidate) {
      nextQuestionPreview = {
        questionId: nextCandidate.id,
        category: nextCandidate.category,
      };
    }
  }

  return {
    completeness: newCompleteness.score,
    isPlaybookReady: newCompleteness.isPlaybookReady,
    preferencesSet: [],
    nextQuestionPreview,
  };
}

// =============================================================================
// resetOnboarding
// =============================================================================

export async function resetOnboarding(userId: string): Promise<void> {
  console.log(`${LOG_PREFIX} resetOnboarding: ${userId}`);

  // Delete all preferences for this user
  await db
    .delete(hunterPreferences)
    .where(eq(hunterPreferences.userId, userId));

  // Reset onboarding step on user record
  await db
    .update(users)
    .set({
      onboardingStep: "welcome",
      onboardingComplete: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`${LOG_PREFIX} Onboarding reset complete for ${userId}`);
}

// =============================================================================
// Helpers
// =============================================================================

function buildProfileSummary(profile: HunterProfile): string {
  const parts: string[] = [];

  const userPrefs = profile.preferences.filter((p) => p.source === "user");

  if (userPrefs.length === 0) {
    return "New hunter, no preferences set yet.";
  }

  const byCat = new Map<string, string[]>();
  for (const p of userPrefs) {
    if (p.key === "__skipped") continue;
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category)!.push(
      typeof p.value === "boolean" ? p.key : `${p.key}: ${JSON.stringify(p.value)}`
    );
  }

  for (const [cat, items] of byCat) {
    const label = COMPLETENESS_WEIGHTS[cat as PreferenceCategory]?.label ?? cat;
    parts.push(`${label}: ${items.join(", ")}`);
  }

  if (profile.pointHoldings.length > 0) {
    parts.push(
      `Points: ${profile.pointHoldings
        .map((p) => `${p.stateCode} ${p.speciesName} ${p.pointType}=${p.points}`)
        .join("; ")}`
    );
  }

  return parts.join(" | ");
}

/**
 * Fallback question text when AI generation fails or prompt is missing.
 */
function getFallbackQuestionText(questionId: string): string {
  const fallbacks: Record<string, string> = {
    species_interest:
      "What species are you most interested in hunting? Select all that apply.",
    hunt_orientation:
      "What's your hunting orientation? Are you focused on filling the freezer, chasing trophies, or a mix of both?",
    timeline:
      "What's your timeline? Are you looking to hunt this year, or are you building a longer-term strategy?",
    budget:
      "What's your approximate annual budget for hunting applications, tags, and travel?",
    existing_points:
      "Do you have any existing preference or bonus points in any states? If so, which states and how many?",
    travel_tolerance:
      "How far are you willing to travel for hunts? Stay close to home, drive regionally, or fly anywhere?",
    hunt_style:
      "What's your preferred hunting style? DIY on public land, private land, guided, or a mix?",
    home_state:
      "What state are you based in? This helps us find nearby opportunities and factor in residency advantages.",
    weapon_preference:
      "What are your weapon preferences? Rifle, archery, muzzleloader, or no preference?",
    physical_ability:
      "How would you describe your comfort level with physical demands? Very fit, moderate, or prefer easier terrain?",
  };

  return fallbacks[questionId] ?? "Tell us more about your hunting preferences.";
}

// Re-export getPreferences for use by onboarding engine consumers
export { getPreferences } from "../profile/profile-service";
