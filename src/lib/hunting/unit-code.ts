import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { huntUnits } from "@/lib/db/schema";

export function normalizeHuntUnitCode(raw: string, stateCode?: string | null): string {
  let code = raw.trim().toUpperCase();
  if (!code) return "";

  code = code.replace(/^(UNIT|AREA|ZONE|GMU|WMA)\s*/i, "");

  switch (stateCode?.toUpperCase()) {
    case "CO":
    case "WY":
      if (/^\d+$/.test(code)) {
        return String(parseInt(code, 10));
      }
      return code;
    case "AZ":
      return code.replace(/^0+/, "") || "0";
    default:
      if (/^\d+$/.test(code)) {
        return String(parseInt(code, 10));
      }
      return code;
  }
}

interface ResolveHuntUnitIdParams {
  unitCode: string;
  stateId?: string;
  speciesId?: string;
  stateCode?: string | null;
}

export async function resolveHuntUnitId({
  unitCode,
  stateId,
  speciesId,
  stateCode,
}: ResolveHuntUnitIdParams): Promise<{ id: string; unitCode: string } | null> {
  const normalized = normalizeHuntUnitCode(unitCode, stateCode);
  if (!normalized) return null;

  const candidates = Array.from(
    new Set([unitCode.trim().toUpperCase(), normalized].filter(Boolean))
  );

  for (const candidate of candidates) {
    const conditions = [eq(huntUnits.unitCode, candidate)];
    if (stateId) conditions.push(eq(huntUnits.stateId, stateId));
    if (speciesId) conditions.push(eq(huntUnits.speciesId, speciesId));

    const row = await db.query.huntUnits.findFirst({
      where: and(...conditions),
      columns: { id: true, unitCode: true },
    });

    if (row) {
      return { id: row.id, unitCode: row.unitCode };
    }
  }

  return null;
}
