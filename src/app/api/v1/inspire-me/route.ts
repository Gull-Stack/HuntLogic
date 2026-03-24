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
  huntUnits,
  states,
  species,
  stateSpecies,
} from "@/lib/db/schema";

// Single source of truth for curated hunt data + region mapping
import {
  REGIONAL_OTC_HUNTS,
  ASPIRATIONAL_HUNTS,
  STATE_TO_REGION,
  type CuratedHuntSuggestion,
  type InspireMotivation,
} from "@/lib/data/state-species-intelligence";

// =============================================================================
// Types
// =============================================================================

type Motivation = InspireMotivation;

interface InspireMeRequest {
  homeState: string;
  motivation: Motivation;
}

type HuntSuggestion = CuratedHuntSuggestion;

interface InspireMeResponse {
  huntThisFall: HuntSuggestion;
  fiveYearDream: HuntSuggestion;
  source: "database" | "curated";
}

// =============================================================================
// Curated fallback data — imported from single source of truth
// (REGIONAL_OTC_HUNTS, ASPIRATIONAL_HUNTS, STATE_TO_REGION are imported above)

// =============================================================================
// Rate limiting (IP-based, in-memory — same pattern as simulation route)
// =============================================================================

const inspireRateLimiter = new Map<string, number[]>();
const INSPIRE_MAX_PER_MIN = 10;
const INSPIRE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = inspireRateLimiter.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < INSPIRE_WINDOW_MS);
  if (recent.length >= INSPIRE_MAX_PER_MIN) return false;
  recent.push(now);
  inspireRateLimiter.set(ip, recent);
  return true;
}

// =============================================================================
// Response cache (in-memory, keyed homeState:motivation, 30-min TTL)
// =============================================================================

interface CachedResponse {
  data: InspireMeResponse;
  cachedAt: number;
}

const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCached(homeState: string, motivation: Motivation): InspireMeResponse | null {
  const key = `${homeState}:${motivation}`;
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(homeState: string, motivation: Motivation, data: InspireMeResponse): void {
  responseCache.set(`${homeState}:${motivation}`, { data, cachedAt: Date.now() });
}

// =============================================================================
// Validation
// =============================================================================

const VALID_MOTIVATIONS = new Set<string>(["freezer", "trophy", "lifetime", "balanced"]);

// Complete set of valid US state codes — rejects "XX", "ZZ", etc.
const VALID_STATE_CODES = new Set<string>([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]);

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
  const homeState = (b["homeState"] as string).toUpperCase().trim();
  if (!VALID_STATE_CODES.has(homeState)) {
    return { ok: false, error: `homeState '${homeState}' is not a valid US state code` };
  }
  if (typeof b["motivation"] !== "string" || !VALID_MOTIVATIONS.has(b["motivation"])) {
    return { ok: false, error: "motivation must be one of: freezer, trophy, lifetime, balanced" };
  }

  return {
    ok: true,
    data: {
      homeState,
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

    // Prefer hunts in the user's region (fallback to "west" for unmapped states)
    const userRegion = STATE_TO_REGION[homeState] ?? "west";
    const regionStates = Object.entries(STATE_TO_REGION)
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
    // Rate limiting — keyed by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body: unknown = await request.json();
    const validation = validateBody(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { homeState, motivation } = validation.data;

    // Cache hit — return immediately
    const cached = getCached(homeState, motivation);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // Try DB-driven results first
    const [dbOtc, dbDream] = await Promise.all([
      findOtcHunt(homeState),
      findAspirationHunt(motivation),
    ]);

    // Use DB results if available, fall back to curated
    const region = STATE_TO_REGION[homeState] ?? "west";
    const curatedOtc = REGIONAL_OTC_HUNTS[region] ?? REGIONAL_OTC_HUNTS["west"]!;
    const curatedDream = ASPIRATIONAL_HUNTS[motivation];

    const huntThisFall = dbOtc ?? curatedOtc;
    const fiveYearDream = dbDream ?? curatedDream;
    const source = (dbOtc || dbDream) ? "database" as const : "curated" as const;

    const response: InspireMeResponse = { huntThisFall, fiveYearDream, source };

    // Cache the result
    setCached(homeState, motivation, response);

    return NextResponse.json(response, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[inspire-me] POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate inspiration" },
      { status: 500 }
    );
  }
}
