// =============================================================================
// Regulations Service
// =============================================================================
// Provides access to state hunting regulation documents (PDFs, HTML, tools).
// =============================================================================

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { stateRegulations } from "@/lib/db/schema/regulations";
import { states } from "@/lib/db/schema/hunting";

export type RegulationFilters = {
  docType?: string;
  year?: number;
};

/**
 * Get all regulation documents for a state, with optional filters.
 */
export async function getRegulationsByState(
  stateCode: string,
  filters?: RegulationFilters
) {
  const stateRow = await db.query.states.findFirst({
    where: eq(states.code, stateCode.toUpperCase()),
  });
  if (!stateRow) return null;

  const conditions = [
    eq(stateRegulations.stateId, stateRow.id),
    eq(stateRegulations.enabled, true),
  ];
  if (filters?.docType) {
    conditions.push(eq(stateRegulations.docType, filters.docType));
  }
  if (filters?.year) {
    conditions.push(eq(stateRegulations.year, filters.year));
  }

  const regulations = await db
    .select()
    .from(stateRegulations)
    .where(and(...conditions))
    .orderBy(stateRegulations.docType, desc(stateRegulations.year));

  return {
    state: {
      code: stateRow.code,
      name: stateRow.name,
      agencyName: stateRow.agencyName,
      agencyUrl: stateRow.agencyUrl,
    },
    regulations,
  };
}

/**
 * Get the URL for a specific regulation document type in a state.
 */
export async function getRegulationUrl(stateCode: string, docType: string) {
  const stateRow = await db.query.states.findFirst({
    where: eq(states.code, stateCode.toUpperCase()),
  });
  if (!stateRow) return null;

  const regulation = await db.query.stateRegulations.findFirst({
    where: and(
      eq(stateRegulations.stateId, stateRow.id),
      eq(stateRegulations.docType, docType),
      eq(stateRegulations.enabled, true)
    ),
    orderBy: desc(stateRegulations.year),
  });

  return regulation?.url ?? null;
}

/**
 * Get all states with counts of their regulation documents.
 */
export async function getAllStatesRegulations() {
  const rows = await db
    .select({
      code: states.code,
      name: states.name,
      agencyName: states.agencyName,
      agencyUrl: states.agencyUrl,
      regulationCount: sql<number>`count(${stateRegulations.id})::int`,
    })
    .from(states)
    .leftJoin(
      stateRegulations,
      and(
        eq(stateRegulations.stateId, states.id),
        eq(stateRegulations.enabled, true)
      )
    )
    .where(eq(states.enabled, true))
    .groupBy(states.id)
    .orderBy(states.name);

  return rows;
}

/**
 * Verify a regulation URL still works via HEAD request.
 * Updates lastVerified on success.
 */
export async function verifyRegulationUrl(regulationId: string) {
  const regulation = await db.query.stateRegulations.findFirst({
    where: eq(stateRegulations.id, regulationId),
  });
  if (!regulation) return { found: false as const };

  try {
    const response = await fetch(regulation.url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    const ok = response.ok;
    if (ok) {
      await db
        .update(stateRegulations)
        .set({ lastVerified: new Date(), updatedAt: new Date() })
        .where(eq(stateRegulations.id, regulationId));
    }

    return {
      found: true as const,
      url: regulation.url,
      status: response.status,
      ok,
    };
  } catch {
    return {
      found: true as const,
      url: regulation.url,
      status: 0,
      ok: false,
    };
  }
}
