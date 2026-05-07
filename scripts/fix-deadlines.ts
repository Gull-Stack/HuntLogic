/**
 * Fix & add missing deadlines based on reference chart fact-check.
 * Run: DATABASE_URL="..." npx tsx scripts/fix-deadlines.ts
 */

import { db } from "../src/lib/db";
import { deadlines } from "../src/lib/db/schema/intelligence";
import { states, species } from "../src/lib/db/schema/hunting";
import { eq, and, sql } from "drizzle-orm";

const LOG = "[fix-deadlines]";

// ============================================================================
// Helpers
// ============================================================================

async function getStateId(code: string): Promise<string> {
  const row = await db
    .select({ id: states.id })
    .from(states)
    .where(eq(states.code, code))
    .limit(1);
  if (!row[0]) throw new Error(`State not found: ${code}`);
  return row[0].id;
}

async function getSpeciesId(slug: string): Promise<string> {
  const row = await db
    .select({ id: species.id })
    .from(species)
    .where(eq(species.slug, slug))
    .limit(1);
  if (!row[0]) throw new Error(`Species not found: ${slug}`);
  return row[0].id;
}

interface DeadlineInput {
  stateCode: string;
  speciesSlug: string | null; // null = applies to all species
  year: number;
  deadlineType: string;
  title: string;
  description?: string;
  deadlineDate: string; // YYYY-MM-DD
}

async function upsertDeadline(input: DeadlineInput) {
  const stateId = await getStateId(input.stateCode);
  const speciesId = input.speciesSlug
    ? await getSpeciesId(input.speciesSlug)
    : null;

  // Check if exists (match on state + title + year)
  const existing = await db
    .select({ id: deadlines.id })
    .from(deadlines)
    .where(
      and(
        eq(deadlines.stateId, stateId),
        eq(deadlines.title, input.title),
        eq(deadlines.year, input.year)
      )
    )
    .limit(1);

  if (existing[0]) {
    // Update the date
    await db
      .update(deadlines)
      .set({
        deadlineDate: input.deadlineDate,
        deadlineType: input.deadlineType,
        description: input.description ?? null,
      })
      .where(eq(deadlines.id, existing[0].id));
    console.log(`${LOG} UPDATED: ${input.title} → ${input.deadlineDate}`);
  } else {
    await db.insert(deadlines).values({
      stateId,
      speciesId,
      year: input.year,
      deadlineType: input.deadlineType,
      title: input.title,
      description: input.description ?? null,
      deadlineDate: input.deadlineDate,
    });
    console.log(`${LOG} INSERTED: ${input.title} → ${input.deadlineDate}`);
  }
}

// ============================================================================
// Corrections & Additions
// ============================================================================

async function main() {
  console.log(`${LOG} Starting deadline corrections...`);

  const entries: DeadlineInput[] = [
    // ====================================================================
    // FIX: Arizona Spring Draw — was Nov 12, ref says Feb 3
    // ====================================================================
    // Note: We'll update the existing AZ Spring Draw entry via direct SQL
    // since the title might differ slightly

    // ====================================================================
    // FIX: Idaho Sheep/Goat/Moose — was Jun 5, ref says Apr 30
    // ====================================================================

    // ====================================================================
    // MISSING: Alaska
    // ====================================================================
    {
      stateCode: "AK",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "application_deadline",
      title: "AK Drawing Permit Application Deadline",
      description: "Alaska drawing permit application deadline for moose, caribou, goat, sheep, elk, bison, muskox",
      deadlineDate: "2025-12-15",
    },
    {
      stateCode: "AK",
      speciesSlug: null,
      year: 2026,
      deadlineType: "draw_results",
      title: "AK Drawing Permit Results",
      description: "Alaska drawing permit results posted",
      deadlineDate: "2026-02-20",
    },

    // ====================================================================
    // MISSING: Idaho NR General Tags (1st & 2nd)
    // ====================================================================
    {
      stateCode: "ID",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "application_open",
      title: "ID NR General Tags 1st Drawing Opens",
      deadlineDate: "2025-12-05",
    },
    {
      stateCode: "ID",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "application_deadline",
      title: "ID NR General Tags 1st Drawing Deadline",
      deadlineDate: "2025-12-15",
    },
    {
      stateCode: "ID",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "draw_results",
      title: "ID NR General Tags 1st Drawing Results",
      deadlineDate: "2026-01-20",
    },
    {
      stateCode: "ID",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "application_open",
      title: "ID NR General Tags 2nd Drawing Opens",
      deadlineDate: "2026-02-05",
    },
    {
      stateCode: "ID",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "application_deadline",
      title: "ID NR General Tags 2nd Drawing Deadline",
      deadlineDate: "2026-02-15",
    },

    // ====================================================================
    // MISSING: Kansas
    // ====================================================================
    {
      stateCode: "KS",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "application_deadline",
      title: "KS Big Game Draw Application Deadline",
      description: "Kansas nonresident elk, deer, antelope, turkey drawing deadline",
      deadlineDate: "2026-04-24",
    },
    {
      stateCode: "KS",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "draw_results",
      title: "KS Big Game Draw Results",
      deadlineDate: "2026-06-15",
    },

    // ====================================================================
    // MISSING: Iowa
    // ====================================================================
    {
      stateCode: "IA",
      speciesSlug: "whitetail",
      year: 2026,
      deadlineType: "application_deadline",
      title: "IA Nonresident Deer/Turkey Draw Deadline",
      description: "Iowa nonresident deer and turkey license drawing deadline",
      deadlineDate: "2026-06-01",
    },
    {
      stateCode: "IA",
      speciesSlug: "whitetail",
      year: 2026,
      deadlineType: "draw_results",
      title: "IA Nonresident Deer/Turkey Draw Results",
      deadlineDate: "2026-06-15",
    },

    // ====================================================================
    // MISSING: Texas Desert Bighorn
    // ====================================================================
    {
      stateCode: "TX",
      speciesSlug: "bighorn_sheep",
      year: 2026,
      deadlineType: "application_deadline",
      title: "TX Desert Bighorn Sheep Permit Drawing Deadline",
      deadlineDate: "2026-11-01",
    },
    {
      stateCode: "TX",
      speciesSlug: "bighorn_sheep",
      year: 2026,
      deadlineType: "draw_results",
      title: "TX Desert Bighorn Sheep Drawing Results",
      deadlineDate: "2026-11-25",
    },

    // ====================================================================
    // MISSING: Arizona 2nd Bison
    // ====================================================================
    {
      stateCode: "AZ",
      speciesSlug: "bison",
      year: 2026,
      deadlineType: "application_deadline",
      title: "AZ 2nd Bison Draw Application Deadline",
      deadlineDate: "2026-10-06",
    },
    {
      stateCode: "AZ",
      speciesSlug: "bison",
      year: 2026,
      deadlineType: "draw_results",
      title: "AZ 2nd Bison Draw Results",
      deadlineDate: "2026-11-05",
    },

    // ====================================================================
    // WRONG: Arizona Fall Draw (Sheep/Deer/Bison) — was Jun 10, ref says Jun 2
    // ====================================================================
    {
      stateCode: "AZ",
      speciesSlug: null,
      year: 2026,
      deadlineType: "application_deadline",
      title: "AZ Fall Draw Application Deadline",
      deadlineDate: "2026-06-02",
    },

    // ====================================================================
    // MISSING: Points-only purchase windows
    // ====================================================================
    {
      stateCode: "MT",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "MT General Preference Point Purchase Window Opens",
      deadlineDate: "2026-07-01",
    },
    {
      stateCode: "MT",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "MT General Preference Point Purchase Deadline",
      deadlineDate: "2026-12-31",
    },
    {
      stateCode: "MT",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "MT Bonus Point Purchase Window Opens",
      deadlineDate: "2026-07-01",
    },
    {
      stateCode: "MT",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "MT Bonus Point Purchase Deadline",
      deadlineDate: "2026-09-30",
    },
    {
      stateCode: "UT",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "UT Points Only Application Deadline",
      deadlineDate: "2026-06-23",
    },
    {
      stateCode: "WY",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "WY Bonus Point Purchase Window Opens",
      deadlineDate: "2026-07-01",
    },
    {
      stateCode: "WY",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "WY Bonus Point Purchase Deadline",
      deadlineDate: "2026-11-02",
    },
    {
      stateCode: "OR",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "OR Bonus Point Purchase Window Opens",
      deadlineDate: "2026-07-01",
    },
    {
      stateCode: "OR",
      speciesSlug: null,
      year: 2026,
      deadlineType: "preference_point",
      title: "OR Bonus Point Purchase Deadline",
      deadlineDate: "2026-11-30",
    },

    // ====================================================================
    // MISSING: Draw Results we didn't have
    // ====================================================================
    {
      stateCode: "NV",
      speciesSlug: "mule_deer",
      year: 2026,
      deadlineType: "draw_results",
      title: "NV NR Guided Mule Deer Draw Results",
      deadlineDate: "2026-03-20",
    },
    {
      stateCode: "MT",
      speciesSlug: "elk",
      year: 2026,
      deadlineType: "draw_results",
      title: "MT Deer/Elk Special Permit Draw Results",
      deadlineDate: "2026-04-15",
    },
    {
      stateCode: "MT",
      speciesSlug: "moose",
      year: 2026,
      deadlineType: "draw_results",
      title: "MT Moose/Bighorn Sheep/Mountain Goat Draw Results",
      deadlineDate: "2026-05-15",
    },
    {
      stateCode: "MT",
      speciesSlug: "pronghorn",
      year: 2026,
      deadlineType: "draw_results",
      title: "MT Antelope/Elk B/Deer B Draw Results",
      deadlineDate: "2026-07-01",
    },
  ];

  // Process all entries
  for (const entry of entries) {
    try {
      await upsertDeadline(entry);
    } catch (err) {
      console.error(`${LOG} ERROR on "${entry.title}":`, err);
    }
  }

  // ========================================================================
  // Direct fixes for existing entries with wrong dates
  // ========================================================================

  // Fix AZ Spring Draw: Nov 12 → Feb 3
  console.log(`\n${LOG} Fixing AZ Spring Draw deadline...`);
  const azStateId = await getStateId("AZ");
  await db
    .update(deadlines)
    .set({ deadlineDate: "2026-02-03" })
    .where(
      and(
        eq(deadlines.stateId, azStateId),
        eq(deadlines.title, "AZ Spring Draw Application Deadline"),
        eq(deadlines.year, 2026)
      )
    );
  console.log(`${LOG} FIXED: AZ Spring Draw → 2026-02-03`);

  // Fix ID Moose/Sheep/Goat: Jun 5 → Apr 30
  console.log(`${LOG} Fixing ID Moose/Sheep/Goat deadline...`);
  const idStateId = await getStateId("ID");
  await db
    .update(deadlines)
    .set({ deadlineDate: "2026-04-30" })
    .where(
      and(
        eq(deadlines.stateId, idStateId),
        eq(deadlines.title, "ID Moose/Sheep/Goat Draw Deadline"),
        eq(deadlines.year, 2026)
      )
    );
  console.log(`${LOG} FIXED: ID Moose/Sheep/Goat → 2026-04-30`);

  console.log(`\n${LOG} Done! All corrections applied.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`${LOG} Fatal:`, err);
  process.exit(1);
});
