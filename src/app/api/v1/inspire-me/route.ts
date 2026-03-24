// =============================================================================
// POST /api/v1/inspire-me — Quick hunt inspiration engine
//
// Given a home state and motivation, returns a "hunt this fall" OTC/easy-draw
// recommendation and a "5-year dream" aspirational hunt.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and, gt, lt, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  drawOdds,
  harvestStats,
  huntUnits,
  states,
  species,
  stateSpecies,
} from "@/lib/db/schema";

// Curated fallback data (used when DB has no data)
import {
  STATE_SPECIES_INTELLIGENCE,
} from "@/lib/data/state-species-intelligence";

// =============================================================================
// Types
// =============================================================================

type Motivation = "freezer" | "trophy" | "lifetime" | "balanced";

interface InspireMeRequest {
  homeState: string;
  motivation: Motivation;
}

interface HuntSuggestion {
  species: string;
  state: string;
  tagline: string;
  difficulty: string;
  unitCode?: string;
  drawRate?: number | null;
  successRate?: number | null;
  yearsToExpect?: string;
  hook?: string;
}

interface InspireMeResponse {
  huntThisFall: HuntSuggestion;
  fiveYearDream: HuntSuggestion;
  source: "database" | "curated";
}

// =============================================================================
// Curated fallback data
// =============================================================================

const REGIONAL_OTC_HUNTS: Record<string, HuntSuggestion> = {
  southeast: { species: "White-tailed Deer", state: "Georgia", tagline: "Some of the best whitetail hunting in the Southeast. OTC license, 750K+ acres of public land.", difficulty: "otc" },
  south: { species: "White-tailed Deer", state: "Texas", tagline: "More whitetail than anywhere on earth. Private land leases are accessible and affordable.", difficulty: "otc" },
  midwest: { species: "Pheasant", state: "South Dakota", tagline: "The pheasant capital of the world. Incredible bird numbers and walk-in access.", difficulty: "otc" },
  west: { species: "Elk", state: "Idaho", tagline: "OTC bull elk tags in the Frank Church Wilderness. No draw, no points — just buy the license.", difficulty: "otc" },
  northwest: { species: "Black Bear", state: "Montana", tagline: "OTC spring bear tags in western Montana. High density, big public land.", difficulty: "otc" },
  southwest: { species: "Mule Deer", state: "Nevada", tagline: "Nevada issues more big game tags than most states. Some mule deer units draw with 0 points.", difficulty: "easy_draw" },
  mountain: { species: "Pronghorn", state: "Wyoming", tagline: "Wyoming has more pronghorn than anywhere on earth. Many units draw in 1-2 years NR.", difficulty: "easy_draw" },
  northeast: { species: "White-tailed Deer", state: "Pennsylvania", tagline: "Pennsylvania has one of the largest whitetail herds in the country. OTC license, huge public land.", difficulty: "otc" },
};

const STATE_REGIONS: Record<string, string> = {
  GA: "southeast", FL: "southeast", SC: "southeast", NC: "southeast", AL: "southeast", MS: "southeast", TN: "southeast", VA: "southeast", AR: "southeast",
  TX: "south", OK: "south", LA: "south", KY: "south",
  SD: "midwest", ND: "midwest", NE: "midwest", KS: "midwest", IA: "midwest", MO: "midwest", MN: "midwest", WI: "midwest", IL: "midwest", IN: "midwest", OH: "midwest", MI: "midwest",
  ID: "west", OR: "west", WA: "northwest", MT: "northwest", AK: "northwest",
  NV: "southwest", AZ: "southwest", NM: "southwest", UT: "southwest",
  WY: "mountain", CO: "mountain",
  CA: "west",
  NY: "northeast", PA: "northeast", VT: "northeast", NH: "northeast", ME: "northeast", MA: "northeast", CT: "northeast", RI: "northeast", NJ: "northeast", DE: "northeast", MD: "northeast", WV: "northeast",
};

const ASPIRATIONAL_HUNTS: Record<Motivation, HuntSuggestion> = {
  freezer: { species: "Rocky Mountain Elk", state: "Idaho", tagline: "OTC bull elk tags available statewide — no draw, no points. A 5-day camp in the Frank Church Wilderness.", difficulty: "otc", yearsToExpect: "This year", hook: "Over-the-counter. No waiting. Just buy the license and go." },
  trophy: { species: "Rocky Mountain Bighorn Sheep", state: "Nevada", tagline: "Nevada issues more bighorn sheep tags than any other state. A true once-in-a-lifetime trophy hunt.", difficulty: "draw", yearsToExpect: "8-15 years", hook: "Start your points today. Nevada is the best NR sheep state in the country." },
  lifetime: { species: "Desert Bighorn Sheep", state: "Arizona", tagline: "Arizona bighorn sheep is the pinnacle of North American big game hunting. Record-class rams in the Sonoran Desert.", difficulty: "draw", yearsToExpect: "15-25 years", hook: "Apply every year. When you draw, it'll be the hunt of your life." },
  balanced: { species: "Bull Elk", state: "Colorado", tagline: "Colorado has the largest elk population on earth. Preference points grow value every year — many units draw in 5-7 years.", difficulty: "draw", yearsToExpect: "3-7 years", hook: "Best ROI in western big game. Start accumulating points now." },
};

// =============================================================================
// Validation
// =============================================================================

const VALID_MOTIVATIONS = new Set<string>(["freezer", "trophy", "lifetime", "balanced"]);

function validateBody(
  body: unknown
): { ok: true; data: InspireMeRequest } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (typeof b["homeState"] !== "string" || b["homeState"].length < 2) {
    return { ok: false, error: "homeState is required (e.g. 'CO')" };
  }
  if (typeof b["motivation"] !== "string" || !VALID_MOTIVATIONS.has(b["motivation"])) {
    return { ok: false, error: "motivation must be one of: freezer, trophy, lifetime, balanced" };
  }

  return {
    ok: true,
    data: {
      homeState: (b["homeState"] as string).toUpperCase(),
      motivation: b["motivation"] as Motivation,
    },
  };
}

// =============================================================================
// DB-driven hunt finder
// =============================================================================

async function findOtcHunt(homeState: string): Promise<HuntSuggestion | null> {
  try {
    // Find OTC hunts from state_species with draw odds data
    // Prefer hunts in or near the user's home region
    const otcRows = await db
      .select({
        stateCode: states.code,
        stateName: states.name,
        speciesName: species.commonName,
        speciesSlug: species.slug,
        unitCode: huntUnits.unitCode,
        drawRate: drawOdds.drawRate,
        successRate: sql<number | null>`(
          SELECT hs.success_rate FROM harvest_stats hs
          WHERE hs.hunt_unit_id = ${huntUnits.id}
            AND hs.species_id = ${species.id}
          ORDER BY hs.year DESC LIMIT 1
        )`,
      })
      .from(stateSpecies)
      .innerJoin(states, eq(stateSpecies.stateId, states.id))
      .innerJoin(species, eq(stateSpecies.speciesId, species.id))
      .innerJoin(huntUnits, and(
        eq(huntUnits.stateId, states.id),
        eq(huntUnits.speciesId, species.id),
      ))
      .leftJoin(drawOdds, and(
        eq(drawOdds.huntUnitId, huntUnits.id),
        eq(drawOdds.stateId, states.id),
        eq(drawOdds.speciesId, species.id),
      ))
      .where(
        and(
          eq(stateSpecies.hasOtc, true),
          eq(states.enabled, true),
          eq(species.enabled, true),
        )
      )
      .orderBy(desc(drawOdds.year))
      .limit(20);

    if (otcRows.length === 0) return null;

    // Prefer hunts in the user's region
    const userRegion = STATE_REGIONS[homeState];
    const regionStates = Object.entries(STATE_REGIONS)
      .filter(([, r]) => r === userRegion)
      .map(([s]) => s);

    // Sort: prefer same region, then high draw rate / success rate
    const sorted = [...otcRows].sort((a, b) => {
      const aRegion = regionStates.includes(a.stateCode) ? 1 : 0;
      const bRegion = regionStates.includes(b.stateCode) ? 1 : 0;
      if (aRegion !== bRegion) return bRegion - aRegion;
      const aScore = (a.successRate ?? 0) + (a.drawRate ?? 0.5);
      const bScore = (b.successRate ?? 0) + (b.drawRate ?? 0.5);
      return bScore - aScore;
    });

    const best = sorted[0]!;
    return {
      species: best.speciesName,
      state: best.stateName,
      tagline: `OTC ${best.speciesName.toLowerCase()} in ${best.stateName}${best.unitCode ? ` (Unit ${best.unitCode})` : ""}.${best.successRate ? ` ${Math.round(best.successRate * 100)}% success rate.` : ""}`,
      difficulty: "otc",
      unitCode: best.unitCode,
      drawRate: best.drawRate,
      successRate: best.successRate,
    };
  } catch (e) {
    console.error("[inspire-me] OTC hunt query error:", e);
    return null;
  }
}

async function findAspirationHunt(motivation: Motivation): Promise<HuntSuggestion | null> {
  try {
    // Trophy/lifetime: low draw rate (<5%), high applicants/tags ratio
    // Freezer: high draw rate (>50%), high success rate
    // Balanced: moderate draw rate, good success

    const isAspirational = motivation === "trophy" || motivation === "lifetime";

    const drawRateFilter = isAspirational
      ? lt(drawOdds.drawRate, 0.05)
      : motivation === "freezer"
        ? gt(drawOdds.drawRate, 0.50)
        : gt(drawOdds.drawRate, 0.15);

    const rows = await db
      .select({
        stateCode: states.code,
        stateName: states.name,
        speciesName: species.commonName,
        unitCode: huntUnits.unitCode,
        drawRate: drawOdds.drawRate,
        totalApplicants: drawOdds.totalApplicants,
        totalTags: drawOdds.totalTags,
        minPointsDrawn: drawOdds.minPointsDrawn,
        successRate: sql<number | null>`(
          SELECT hs.success_rate FROM harvest_stats hs
          WHERE hs.hunt_unit_id = ${huntUnits.id}
            AND hs.species_id = ${species.id}
          ORDER BY hs.year DESC LIMIT 1
        )`,
      })
      .from(drawOdds)
      .innerJoin(huntUnits, eq(drawOdds.huntUnitId, huntUnits.id))
      .innerJoin(states, eq(drawOdds.stateId, states.id))
      .innerJoin(species, eq(drawOdds.speciesId, species.id))
      .where(
        and(
          drawRateFilter,
          eq(states.enabled, true),
          eq(species.enabled, true),
        )
      )
      .orderBy(desc(drawOdds.year))
      .limit(30);

    if (rows.length === 0) return null;

    // Score and sort by motivation
    const scored = rows.map((r) => {
      const appsPerTag = (r.totalApplicants ?? 0) / Math.max(r.totalTags ?? 1, 1);
      let score = 0;

      if (isAspirational) {
        // High prestige: many applicants per tag, low draw rate
        score = appsPerTag * 0.5 + (1 - (r.drawRate ?? 0)) * 0.3 + (r.successRate ?? 0) * 0.2;
      } else if (motivation === "freezer") {
        // High success, high draw rate
        score = (r.successRate ?? 0) * 0.6 + (r.drawRate ?? 0) * 0.4;
      } else {
        // Balanced
        score = (r.successRate ?? 0) * 0.35 + (r.drawRate ?? 0) * 0.35 + Math.min(appsPerTag / 10, 1) * 0.3;
      }

      return { ...r, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0]!;
    const appsPerTag = Math.round((best.totalApplicants ?? 0) / Math.max(best.totalTags ?? 1, 1));
    const estYears = isAspirational
      ? `${Math.max(5, Math.round(appsPerTag * 0.8))}-${Math.round(appsPerTag * 1.5)} years`
      : motivation === "freezer"
        ? "This year"
        : "3-7 years";

    return {
      species: best.speciesName,
      state: best.stateName,
      tagline: `${best.speciesName} in ${best.stateName}${best.unitCode ? ` (Unit ${best.unitCode})` : ""}. ${best.drawRate !== null ? `${(best.drawRate * 100).toFixed(1)}% draw rate.` : ""}${best.successRate ? ` ${Math.round(best.successRate * 100)}% success.` : ""}`,
      difficulty: isAspirational ? "draw" : "easy_draw",
      unitCode: best.unitCode,
      drawRate: best.drawRate,
      successRate: best.successRate,
      yearsToExpect: estYears,
      hook: isAspirational
        ? `${appsPerTag}:1 applicants per tag — high demand for a reason. Start building points today.`
        : motivation === "freezer"
          ? "Realistic draw odds and strong harvest numbers."
          : "Good balance of draw odds and hunt quality.",
    };
  } catch (e) {
    console.error("[inspire-me] Aspiration hunt query error:", e);
    return null;
  }
}

// =============================================================================
// POST handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const validation = validateBody(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { homeState, motivation } = validation.data;

    // Try DB-driven results first
    const [dbOtc, dbDream] = await Promise.all([
      findOtcHunt(homeState),
      findAspirationHunt(motivation),
    ]);

    // Use DB results if available, fall back to curated
    const region = STATE_REGIONS[homeState] ?? "west";
    const curatedOtc = REGIONAL_OTC_HUNTS[region] ?? REGIONAL_OTC_HUNTS["west"]!;
    const curatedDream = ASPIRATIONAL_HUNTS[motivation];

    const huntThisFall = dbOtc ?? curatedOtc;
    const fiveYearDream = dbDream ?? curatedDream;
    const source = (dbOtc || dbDream) ? "database" as const : "curated" as const;

    return NextResponse.json({
      huntThisFall,
      fiveYearDream,
      source,
    } satisfies InspireMeResponse);
  } catch (error) {
    console.error("[inspire-me] POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate inspiration" },
      { status: 500 }
    );
  }
}
