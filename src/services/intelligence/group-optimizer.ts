// =============================================================================
// Group Optimizer — Find hunts that work for all group members
// =============================================================================

import { db } from "@/lib/db";
import { pointHoldings, stateSpecies, states, species } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

interface GroupSuggestion {
  stateCode: string;
  stateName: string;
  speciesSlug: string;
  speciesName: string;
  drawType: "otc" | "draw" | "mixed";
  groupDrawProbability: string;
  estimatedCost: string;
  reason: string;
}

/**
 * Generate hunt suggestions that work for all group members.
 */
export async function optimizeForGroup(
  memberUserIds: string[],
  targetYear?: number
): Promise<GroupSuggestion[]> {
  if (memberUserIds.length === 0) return [];

  // Get all OTC state-species combos (everyone can hunt these)
  const otcOptions = await db
    .select({
      stateId: stateSpecies.stateId,
      speciesId: stateSpecies.speciesId,
      stateCode: states.code,
      stateName: states.name,
      speciesSlug: species.slug,
      speciesName: species.commonName,
      hasOtc: stateSpecies.hasOtc,
      hasDraw: stateSpecies.hasDraw,
    })
    .from(stateSpecies)
    .innerJoin(states, eq(stateSpecies.stateId, states.id))
    .innerJoin(species, eq(stateSpecies.speciesId, species.id))
    .where(eq(states.enabled, true));

  const suggestions: GroupSuggestion[] = [];

  // Prioritize OTC options — no draw needed, everyone can go
  const otcOpts = otcOptions.filter((o) => o.hasOtc);
  for (const opt of otcOpts.slice(0, 5)) {
    suggestions.push({
      stateCode: opt.stateCode,
      stateName: opt.stateName,
      speciesSlug: opt.speciesSlug,
      speciesName: opt.speciesName,
      drawType: "otc",
      groupDrawProbability: "100%",
      estimatedCost: "Varies",
      reason: `OTC tags available — no draw needed, entire group can participate.`,
    });
  }

  // Add draw options where members have similar point holdings
  const drawOpts = otcOptions.filter((o) => o.hasDraw && !o.hasOtc);
  for (const opt of drawOpts.slice(0, 3)) {
    // Check point holdings across members
    const holdings = await db
      .select({ points: pointHoldings.points, userId: pointHoldings.userId })
      .from(pointHoldings)
      .where(
        and(
          inArray(pointHoldings.userId, memberUserIds),
          eq(pointHoldings.stateId, opt.stateId),
          eq(pointHoldings.speciesId, opt.speciesId)
        )
      );

    if (holdings.length > 0) {
      const minPoints = Math.min(...holdings.map((h) => h.points));
      const maxPoints = Math.max(...holdings.map((h) => h.points));
      const spread = maxPoints - minPoints;

      if (spread <= 3) {
        suggestions.push({
          stateCode: opt.stateCode,
          stateName: opt.stateName,
          speciesSlug: opt.speciesSlug,
          speciesName: opt.speciesName,
          drawType: "draw",
          groupDrawProbability: spread === 0 ? "Similar odds" : "Points vary slightly",
          estimatedCost: "Varies",
          reason: `Group members have ${minPoints}-${maxPoints} points. Close enough to draw together.`,
        });
      }
    }
  }

  return suggestions.slice(0, 5);
}
