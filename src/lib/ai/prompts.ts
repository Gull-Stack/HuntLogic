/**
 * Prompt Template Loader
 *
 * Loads prompt templates from the database (ai_prompts table)
 * with fallback to hardcoded defaults.
 */

// TODO: Import from db when ready
// import { db } from "@/lib/db";
// import { aiPrompts } from "@/lib/db/schema/config";

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
    systemPrompt: `You are HuntLogic Concierge, an expert AI assistant for western big game hunting. You have deep knowledge of:
- Draw systems and application strategies for all western states (CO, WY, MT, ID, NM, AZ, UT, NV, OR)
- Preference and bonus point systems
- Historical draw odds and harvest statistics
- Season structures, weapon types, and unit-specific information
- Multi-year application strategies to maximize tag odds
- Public land access, terrain, and hunt unit characteristics

Always provide accurate, data-driven advice. When uncertain, clearly state your confidence level. Recommend specific units and strategies based on the user's profile, points, and goals.`,
    userPromptTemplate: "{{context}}\n\nUser question: {{query}}",
    model: null,
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

/**
 * Load a prompt template by slug.
 * Tries the database first, falls back to defaults.
 */
export async function loadPrompt(slug: string): Promise<PromptTemplate | null> {
  // TODO: Query database for prompt
  // const dbPrompt = await db.query.aiPrompts.findFirst({
  //   where: and(eq(aiPrompts.slug, slug), eq(aiPrompts.isActive, true)),
  //   orderBy: desc(aiPrompts.createdAt),
  // });

  // Fall back to default
  return DEFAULT_PROMPTS[slug] || null;
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
