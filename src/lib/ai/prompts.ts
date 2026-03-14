/**
 * Prompt Template Loader
 *
 * Loads prompt templates from the database (ai_prompts table)
 * with fallback to hardcoded defaults.
 */

import { db } from "@/lib/db";
import { aiPrompts } from "@/lib/db/schema/config";
import { eq, and, desc } from "drizzle-orm";
import { config } from "@/lib/config";

export interface PromptTemplate {
  slug: string;
  systemPrompt: string | null;
  userPromptTemplate: string;
  model: string | null;
  maxTokens: number | null;
  temperature: number | null;
}

// Default prompts used when database is not available
const DEFAULT_PROMPTS: Record<string, PromptTemplate> = {
  concierge: {
    slug: "concierge",
    systemPrompt: `You are Teddy, the AI concierge for HuntLogic — a national hunting guide powered by real state agency data. You are knowledgeable, direct, and friendly — like a seasoned outfitter who's been guiding for 30 years and genuinely wants hunters to fill their tags.

You have deep knowledge of:
- Draw systems and application strategies for all 50 US states
- Preference point, bonus point, and squared bonus point systems
- Historical draw odds, point creep trends, and harvest statistics
- Season structures, weapon types, and unit-specific information
- Multi-year application strategies to maximize tag odds
- Public land access, terrain, and hunt unit characteristics
- Tag costs, license fees, and total trip budgeting
- OTC (over-the-counter) opportunities across all states

How you help:
- Use specific numbers: draw odds percentages, point thresholds, cost breakdowns
- When uncertain, clearly state your confidence level
- Reference specific state agency data when available
- Keep responses concise but thorough — hunters want answers, not essays
- Never fabricate draw odds or statistics — say "I don't have that specific data" if unsure
- Recommend checking official state agency websites for the most current regulations
- Consider the hunter's full picture: budget, time, experience, physical fitness, travel distance`,
    userPromptTemplate: "{{context}}\n\nUser question: {{query}}",
    model: config.ai.model,
    maxTokens: 4096,
    temperature: 0.7,
  },
  recommendation: {
    slug: "recommendation",
    systemPrompt: `You are HuntLogic's recommendation engine. Given a hunter's profile, preferences, point holdings, and application history, generate specific hunt recommendations with detailed rationale. Consider draw odds trends, harvest success rates, point accumulation strategies, and the hunter's stated goals.`,
    userPromptTemplate:
      "{{context}}\n\nHunter Profile:\n{{profile}}\n\nGenerate recommendations for {{year}}.",
    model: null,
    maxTokens: 8192,
    temperature: 0.5,
  },
  playbook: {
    slug: "playbook",
    systemPrompt: `You are HuntLogic's strategic planning engine. Create multi-year hunting application strategies that optimize for the hunter's goals while accounting for point accumulation, draw odds trends, and opportunity costs across multiple states and species.`,
    userPromptTemplate:
      "{{context}}\n\nHunter Profile:\n{{profile}}\n\nCreate a {{years}}-year playbook starting from {{startYear}}.",
    model: null,
    maxTokens: 8192,
    temperature: 0.4,
  },
};

// In-memory prompt cache with configurable TTL (default 5 minutes)
const promptCache = new Map<string, { prompt: PromptTemplate; expiresAt: number }>();

/**
 * Load a prompt template by slug.
 * Tries the in-memory cache, then the database, then falls back to defaults.
 */
export async function loadPrompt(slug: string): Promise<PromptTemplate | null> {
  // 1. Check cache
  const cached = promptCache.get(slug);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.prompt;
  }

  // 2. Query database
  try {
    const dbPrompt = await db.query.aiPrompts.findFirst({
      where: and(eq(aiPrompts.slug, slug), eq(aiPrompts.active, true)),
      orderBy: desc(aiPrompts.version),
    });

    if (dbPrompt) {
      // The DB stores the system prompt in `template`.
      // For the user prompt template, check `variables` metadata for a
      // custom user_prompt_template, then fall back to the hardcoded
      // default's userPromptTemplate, then a generic pattern.
      const vars = dbPrompt.variables as Record<string, unknown> | unknown[];
      const customUserTemplate =
        !Array.isArray(vars) && typeof vars === "object"
          ? (vars.user_prompt_template as string | undefined)
          : undefined;

      const defaultForSlug = DEFAULT_PROMPTS[dbPrompt.slug];

      const prompt: PromptTemplate = {
        slug: dbPrompt.slug,
        systemPrompt: dbPrompt.template,
        userPromptTemplate:
          customUserTemplate ??
          defaultForSlug?.userPromptTemplate ??
          "{{context}}\n\nUser question: {{query}}",
        model: dbPrompt.model,
        maxTokens: dbPrompt.maxTokens,
        temperature: dbPrompt.temperature,
      };
      promptCache.set(slug, { prompt, expiresAt: Date.now() + config.cache.promptTtlMs });
      return prompt;
    }
  } catch (error) {
    console.error(`[prompts] Failed to load prompt "${slug}" from DB:`, error);
  }

  // 3. Fall back to hardcoded defaults
  const fallback = DEFAULT_PROMPTS[slug] || null;
  if (fallback) {
    promptCache.set(slug, { prompt: fallback, expiresAt: Date.now() + config.cache.promptTtlMs });
  }
  return fallback;
}

/**
 * Clear the prompt cache. Call when prompts are updated in the DB
 * (e.g., from an admin API endpoint).
 */
export function clearPromptCache(slug?: string): void {
  if (slug) {
    promptCache.delete(slug);
  } else {
    promptCache.clear();
  }
}

/**
 * Interpolate variables into a prompt template.
 */
export function interpolatePrompt(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}
