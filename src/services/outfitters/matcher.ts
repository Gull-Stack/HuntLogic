// =============================================================================
// Outfitter Matcher — Find outfitters matching a recommendation
// =============================================================================

import { db } from "@/lib/db";
import { outfitters } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

interface OutfitterMatch {
  id: string;
  name: string;
  stateCode: string;
  speciesSlugs: string[];
  rating: number;
  reviewCount: number;
  priceRange: string | null;
  website: string | null;
}

export async function findMatchingOutfitters(
  stateCode: string,
  speciesSlug: string,
  maxResults: number = 5
): Promise<OutfitterMatch[]> {
  const rows = await db
    .select({
      id: outfitters.id,
      name: outfitters.name,
      stateCode: outfitters.stateCode,
      speciesSlugs: outfitters.speciesSlugs,
      rating: outfitters.rating,
      reviewCount: outfitters.reviewCount,
      priceRange: outfitters.priceRange,
      website: outfitters.website,
    })
    .from(outfitters)
    .where(
      and(
        eq(outfitters.stateCode, stateCode),
        eq(outfitters.enabled, true)
      )
    )
    .orderBy(desc(outfitters.rating), desc(outfitters.reviewCount))
    .limit(maxResults * 2);

  // Filter by species overlap
  const matches = rows.filter((r) => {
    const slugs = r.speciesSlugs as string[];
    return slugs.includes(speciesSlug);
  });

  return matches.slice(0, maxResults).map((r) => ({
    ...r,
    speciesSlugs: r.speciesSlugs as string[],
  }));
}
