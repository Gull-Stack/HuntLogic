import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, type SQL, type AnyColumn } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  drawOdds,
  harvestStats,
  seasons,
} from "@/lib/db/schema/intelligence";
import { states, species, huntUnits } from "@/lib/db/schema/hunting";
import {
  hunterPreferences,
  pointHoldings,
  playbooks,
  recommendations,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { sendMessage, ADVANCED_MODEL } from "@/lib/ai/client";
import { loadPrompt, interpolatePrompt } from "@/lib/ai/prompts";
import { resolveHuntUnitId } from "@/lib/hunting/unit-code";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get("state");
    const speciesParam = searchParams.get("species");
    const unitParam = searchParams.get("unit");
    const yearParam = searchParams.get("year");

    // Resolve state code to stateId
    let stateId: string | undefined;
    if (stateParam) {
      const stateRow = await db.query.states.findFirst({
        where: eq(states.code, stateParam.toUpperCase()),
      });
      if (!stateRow) {
        return NextResponse.json(
          { error: `State not found: ${stateParam}` },
          { status: 404 }
        );
      }
      stateId = stateRow.id;
    }

    // Resolve species slug to speciesId
    let speciesId: string | undefined;
    if (speciesParam) {
      const speciesRow = await db.query.species.findFirst({
        where: eq(species.slug, speciesParam),
      });
      if (!speciesRow) {
        return NextResponse.json(
          { error: `Species not found: ${speciesParam}` },
          { status: 404 }
        );
      }
      speciesId = speciesRow.id;
    }

    // Resolve unit code to huntUnitId (requires stateId for uniqueness)
    let huntUnitId: string | undefined;
    if (unitParam) {
      const resolvedUnit = await resolveHuntUnitId({
        unitCode: unitParam,
        stateId,
        speciesId,
        stateCode: stateParam,
      });
      if (!resolvedUnit) {
        return NextResponse.json(
          { error: `Hunt unit not found: ${unitParam}` },
          { status: 404 }
        );
      }
      huntUnitId = resolvedUnit.id;
    }

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    if (yearParam && (isNaN(year!) || year! < 1900 || year! > 2100)) {
      return NextResponse.json(
        { error: `Invalid year: ${yearParam}` },
        { status: 400 }
      );
    }

    // Build dynamic where conditions for each table
    // Use a loose structural type so drawOdds, harvestStats, and seasons all satisfy it
    const buildConditions = (table: {
      stateId: AnyColumn;
      speciesId: AnyColumn;
      huntUnitId: AnyColumn;
      year: AnyColumn;
    }): SQL | undefined => {
      const conditions: SQL[] = [];
      if (stateId) conditions.push(eq(table.stateId, stateId));
      if (speciesId) conditions.push(eq(table.speciesId, speciesId));
      if (huntUnitId) conditions.push(eq(table.huntUnitId, huntUnitId));
      if (year) conditions.push(eq(table.year, year));
      return conditions.length > 0 ? and(...conditions) : undefined;
    };

    // Query all three tables in parallel
    const [drawOddsData, harvestStatsData, seasonsData] = await Promise.all([
      db
        .select()
        .from(drawOdds)
        .where(buildConditions(drawOdds))
        .orderBy(desc(drawOdds.year))
        .limit(50),
      db
        .select()
        .from(harvestStats)
        .where(buildConditions(harvestStats))
        .orderBy(desc(harvestStats.year))
        .limit(50),
      db
        .select()
        .from(seasons)
        .where(buildConditions(seasons))
        .orderBy(desc(seasons.year))
        .limit(50),
    ]);

    return NextResponse.json({
      drawOdds: drawOddsData,
      harvestStats: harvestStatsData,
      seasons: seasonsData,
    });
  } catch (error) {
    console.error("Intelligence GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/v1/intelligence — AI-powered intelligence query
// =============================================================================
// Accepts a natural language question about hunting and returns a structured
// JSON response with the AI's answer and referenced data sources.
// =============================================================================

export const runtime = "nodejs";
export const maxDuration = 60;

interface IntelligenceRequestBody {
  query: string;
  context?: {
    stateCode?: string;
    species?: string;
    year?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    let body: IntelligenceRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { query, context: filters } = body;

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json(
        { error: "Query is required and must be at least 3 characters" },
        { status: 400 }
      );
    }

    // 3. Load the user's hunter profile context
    const profileContext = await loadHunterProfileContext(session.user.id);

    // 4. Resolve context filters and load relevant intelligence data
    const dataContext = await loadIntelligenceData(filters);

    // 5. Build the prompt context from profile + data + filters
    const contextParts: string[] = [];

    if (profileContext) {
      contextParts.push(profileContext);
    }

    if (filters?.stateCode || filters?.species || filters?.year) {
      const filterParts: string[] = [];
      if (filters.stateCode) filterParts.push(`State: ${filters.stateCode.toUpperCase()}`);
      if (filters.species) filterParts.push(`Species: ${filters.species}`);
      if (filters.year) filterParts.push(`Year: ${filters.year}`);
      contextParts.push(`[Query Filters]\n${filterParts.join(", ")}`);
    }

    if (dataContext) {
      contextParts.push(dataContext);
    }

    const contextString = contextParts.join("\n\n");

    // 6. Load the concierge prompt template
    const promptTemplate = await loadPrompt("concierge");
    if (!promptTemplate) {
      console.error("[intelligence] Failed to load concierge prompt template");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Build the system prompt with a structured-output instruction appended
    const systemPrompt = [
      promptTemplate.systemPrompt || "",
      "",
      "IMPORTANT: You are answering an intelligence query. Return your response in the following structured format:",
      "",
      "First, provide your detailed analysis answering the hunter's question.",
      "",
      "Then, at the very end of your response, include a line starting with exactly 'SOURCES:' followed by a comma-separated list of the data sources you referenced (e.g., state agency names, dataset types like 'CO draw odds 2024', 'WY harvest stats 2023'). If you did not reference any specific data sources, write 'SOURCES: general knowledge'.",
    ].join("\n");

    // Interpolate user prompt template
    const userMessage = interpolatePrompt(promptTemplate.userPromptTemplate, {
      context: contextString,
      query: query.trim(),
    });

    // 7. Call Claude
    const response = await sendMessage({
      messages: [{ role: "user", content: userMessage }],
      systemPrompt,
      model: promptTemplate.model || ADVANCED_MODEL,
      maxTokens: promptTemplate.maxTokens || 4096,
      temperature: promptTemplate.temperature ?? 0.7,
    });

    // 8. Extract the text response
    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.text || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Failed to generate intelligence response" },
        { status: 502 }
      );
    }

    // 9. Parse the response into answer + sources
    const { answer, sources } = parseIntelligenceResponse(rawText);

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("[intelligence] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// Parse structured response into answer + sources
// =============================================================================

function parseIntelligenceResponse(raw: string): {
  answer: string;
  sources: string[];
} {
  // Look for a "SOURCES:" line at the end of the response
  const sourcesMatch = raw.match(/\nSOURCES:\s*(.+)$/im);

  if (sourcesMatch && sourcesMatch.index != null && sourcesMatch[1]) {
    const answer = raw.slice(0, sourcesMatch.index).trim();
    const sourcesRaw = sourcesMatch[1].trim();
    const sources = sourcesRaw
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== "general knowledge");

    return {
      answer: answer || raw.trim(),
      sources: sources.length > 0 ? sources : ["general knowledge"],
    };
  }

  // No SOURCES line found — return the whole thing as the answer
  return {
    answer: raw.trim(),
    sources: ["general knowledge"],
  };
}

// =============================================================================
// Load hunter profile context (preferences, point holdings, active recs)
// =============================================================================

async function loadHunterProfileContext(userId: string): Promise<string> {
  try {
    // --- 1. Hunter Preferences ---
    const prefs = await db
      .select({
        category: hunterPreferences.category,
        key: hunterPreferences.key,
        value: hunterPreferences.value,
      })
      .from(hunterPreferences)
      .where(eq(hunterPreferences.userId, userId));

    const speciesInterests: string[] = [];
    const stateInterests: string[] = [];
    let budget: string | null = null;
    let experience: string | null = null;
    let orientation: string | null = null;
    const otherPrefs: string[] = [];

    for (const p of prefs) {
      if (p.category === "species_interest") {
        speciesInterests.push(String(p.key).replace(/_/g, " "));
      } else if (p.category === "state_interest") {
        stateInterests.push(String(p.key).toUpperCase());
      } else if (p.category === "budget" && p.key === "annual_budget") {
        budget = String(p.value).replace(/_/g, " ");
      } else if (p.category === "experience" && p.key === "experience_level") {
        experience = String(p.value).replace(/_/g, " ");
      } else if (p.category === "hunt_orientation" && p.key === "orientation") {
        orientation = String(p.value).replace(/_/g, " ");
      } else if (
        p.category === "weapon" ||
        p.category === "travel" ||
        p.category === "physical" ||
        p.category === "timeline"
      ) {
        otherPrefs.push(`${p.key.replace(/_/g, " ")}: ${JSON.stringify(p.value)}`);
      }
    }

    const prefParts: string[] = [];
    if (speciesInterests.length > 0) {
      if (stateInterests.length > 0) {
        prefParts.push(
          `${speciesInterests.join(", ")} (${stateInterests.join(", ")})`
        );
      } else {
        prefParts.push(speciesInterests.join(", "));
      }
    } else if (stateInterests.length > 0) {
      prefParts.push(`states: ${stateInterests.join(", ")}`);
    }
    if (budget) prefParts.push(`budget: ${budget}`);
    if (experience) prefParts.push(`experience: ${experience}`);
    if (orientation) prefParts.push(`orientation: ${orientation}`);
    if (otherPrefs.length > 0) prefParts.push(...otherPrefs);

    // --- 2. Point Holdings ---
    const points = await db
      .select({
        stateCode: states.code,
        speciesName: species.commonName,
        points: pointHoldings.points,
        pointType: pointHoldings.pointType,
      })
      .from(pointHoldings)
      .innerJoin(states, eq(pointHoldings.stateId, states.id))
      .innerJoin(species, eq(pointHoldings.speciesId, species.id))
      .where(eq(pointHoldings.userId, userId));

    // --- 3. Top 3 Active Recommendations ---
    const activePlaybook = await db.query.playbooks.findFirst({
      where: and(eq(playbooks.userId, userId), eq(playbooks.status, "active")),
    });

    let topRecs: {
      stateCode: string;
      speciesName: string;
      unitCode: string | null;
      score: number | null;
      rationale: string | null;
      rank: number | null;
    }[] = [];

    if (activePlaybook) {
      topRecs = await db
        .select({
          stateCode: states.code,
          speciesName: species.commonName,
          unitCode: huntUnits.unitCode,
          score: recommendations.score,
          rationale: recommendations.rationale,
          rank: recommendations.rank,
        })
        .from(recommendations)
        .innerJoin(states, eq(recommendations.stateId, states.id))
        .innerJoin(species, eq(recommendations.speciesId, species.id))
        .leftJoin(huntUnits, eq(recommendations.huntUnitId, huntUnits.id))
        .where(
          and(
            eq(recommendations.userId, userId),
            eq(recommendations.playbookId, activePlaybook.id),
            eq(recommendations.status, "active")
          )
        )
        .orderBy(recommendations.rank)
        .limit(3);
    }

    // --- Format the profile context block ---
    const lines: string[] = ["[Hunter Profile]"];

    if (prefParts.length > 0) {
      lines.push(`Preferences: ${prefParts.join(", ")}`);
    } else {
      lines.push("Preferences: (none set yet)");
    }

    if (points.length > 0) {
      const pointStrs = points.map(
        (p) => `${p.stateCode} ${p.speciesName} ${p.points}pts (${p.pointType})`
      );
      lines.push(`Points: ${pointStrs.join(", ")}`);
    } else {
      lines.push("Points: (none recorded)");
    }

    if (topRecs.length > 0) {
      const recStrs = topRecs.map((r, i) => {
        const unit = r.unitCode ? ` ${r.unitCode}` : "";
        const score = r.score != null ? ` (score: ${r.score.toFixed(2)})` : "";
        return `#${i + 1} ${r.stateCode}${unit} ${r.speciesName}${score}`;
      });
      lines.push(`Active Recommendations: ${recStrs.join(", ")}`);
    } else {
      lines.push("Active Recommendations: (none yet)");
    }

    return lines.join("\n");
  } catch (err) {
    console.warn(
      "[intelligence] Failed to load hunter profile context:",
      err instanceof Error ? err.message : String(err)
    );
    return "";
  }
}

// =============================================================================
// Load relevant intelligence data based on context filters
// =============================================================================

async function loadIntelligenceData(
  filters?: IntelligenceRequestBody["context"]
): Promise<string> {
  if (!filters?.stateCode && !filters?.species && !filters?.year) {
    return "";
  }

  try {
    // Resolve state code
    let stateId: string | undefined;
    let stateName: string | undefined;
    if (filters.stateCode) {
      const stateRow = await db.query.states.findFirst({
        where: eq(states.code, filters.stateCode.toUpperCase()),
      });
      if (stateRow) {
        stateId = stateRow.id;
        stateName = stateRow.name;
      }
    }

    // Resolve species slug
    let speciesId: string | undefined;
    let speciesName: string | undefined;
    if (filters.species) {
      const speciesRow = await db.query.species.findFirst({
        where: eq(species.slug, filters.species),
      });
      if (speciesRow) {
        speciesId = speciesRow.id;
        speciesName = speciesRow.commonName;
      }
    }

    // Build conditions per table to avoid cross-table type mismatches
    const drawOddsConditions: SQL[] = [];
    if (stateId) drawOddsConditions.push(eq(drawOdds.stateId, stateId));
    if (speciesId) drawOddsConditions.push(eq(drawOdds.speciesId, speciesId));
    if (filters.year) drawOddsConditions.push(eq(drawOdds.year, filters.year));

    const harvestConditions: SQL[] = [];
    if (stateId) harvestConditions.push(eq(harvestStats.stateId, stateId));
    if (speciesId) harvestConditions.push(eq(harvestStats.speciesId, speciesId));
    if (filters.year) harvestConditions.push(eq(harvestStats.year, filters.year));

    const seasonConditions: SQL[] = [];
    if (stateId) seasonConditions.push(eq(seasons.stateId, stateId));
    if (speciesId) seasonConditions.push(eq(seasons.speciesId, speciesId));
    if (filters.year) seasonConditions.push(eq(seasons.year, filters.year));

    // Query intelligence data in parallel (limited to most recent/relevant)
    const [recentDrawOdds, recentHarvestStats, recentSeasons] =
      await Promise.all([
        db
          .select({
            year: drawOdds.year,
            residentType: drawOdds.residentType,
            weaponType: drawOdds.weaponType,
            totalApplicants: drawOdds.totalApplicants,
            totalTags: drawOdds.totalTags,
            minPointsDrawn: drawOdds.minPointsDrawn,
            maxPointsDrawn: drawOdds.maxPointsDrawn,
            drawRate: drawOdds.drawRate,
          })
          .from(drawOdds)
          .where(drawOddsConditions.length > 0 ? and(...drawOddsConditions) : undefined)
          .orderBy(desc(drawOdds.year))
          .limit(20),
        db
          .select({
            year: harvestStats.year,
            weaponType: harvestStats.weaponType,
            totalHunters: harvestStats.totalHunters,
            totalHarvest: harvestStats.totalHarvest,
            successRate: harvestStats.successRate,
            avgDaysHunted: harvestStats.avgDaysHunted,
          })
          .from(harvestStats)
          .where(harvestConditions.length > 0 ? and(...harvestConditions) : undefined)
          .orderBy(desc(harvestStats.year))
          .limit(20),
        db
          .select({
            year: seasons.year,
            seasonName: seasons.seasonName,
            weaponType: seasons.weaponType,
            startDate: seasons.startDate,
            endDate: seasons.endDate,
            tagType: seasons.tagType,
            quota: seasons.quota,
          })
          .from(seasons)
          .where(seasonConditions.length > 0 ? and(...seasonConditions) : undefined)
          .orderBy(desc(seasons.year))
          .limit(20),
      ]);

    // Format the data as a readable context block
    const dataParts: string[] = [];
    const subjectLabel = [
      stateName || filters.stateCode?.toUpperCase(),
      speciesName || filters.species,
    ]
      .filter(Boolean)
      .join(" / ");

    if (recentDrawOdds.length > 0) {
      const oddsLines = recentDrawOdds.map((d) => {
        const parts: string[] = [`${d.year}`];
        if (d.residentType) parts.push(d.residentType);
        if (d.weaponType) parts.push(d.weaponType);
        if (d.drawRate != null) parts.push(`draw rate: ${(d.drawRate * 100).toFixed(1)}%`);
        if (d.totalApplicants != null && d.totalTags != null) {
          parts.push(`${d.totalTags} tags / ${d.totalApplicants} applicants`);
        }
        if (d.minPointsDrawn != null) parts.push(`min pts: ${d.minPointsDrawn}`);
        if (d.maxPointsDrawn != null) parts.push(`max pts: ${d.maxPointsDrawn}`);
        return `  - ${parts.join(" | ")}`;
      });
      dataParts.push(`[Draw Odds${subjectLabel ? ` — ${subjectLabel}` : ""}]\n${oddsLines.join("\n")}`);
    }

    if (recentHarvestStats.length > 0) {
      const harvestLines = recentHarvestStats.map((h) => {
        const parts: string[] = [`${h.year}`];
        if (h.weaponType) parts.push(h.weaponType);
        if (h.successRate != null) parts.push(`success: ${(h.successRate * 100).toFixed(1)}%`);
        if (h.totalHunters != null) parts.push(`${h.totalHunters} hunters`);
        if (h.totalHarvest != null) parts.push(`${h.totalHarvest} harvested`);
        if (h.avgDaysHunted != null) parts.push(`avg ${h.avgDaysHunted.toFixed(1)} days`);
        return `  - ${parts.join(" | ")}`;
      });
      dataParts.push(`[Harvest Stats${subjectLabel ? ` — ${subjectLabel}` : ""}]\n${harvestLines.join("\n")}`);
    }

    if (recentSeasons.length > 0) {
      const seasonLines = recentSeasons.map((s) => {
        const parts: string[] = [`${s.year}`];
        if (s.seasonName) parts.push(s.seasonName);
        if (s.weaponType) parts.push(s.weaponType);
        if (s.tagType) parts.push(s.tagType);
        if (s.startDate && s.endDate) parts.push(`${s.startDate} to ${s.endDate}`);
        if (s.quota != null) parts.push(`quota: ${s.quota}`);
        return `  - ${parts.join(" | ")}`;
      });
      dataParts.push(`[Seasons${subjectLabel ? ` — ${subjectLabel}` : ""}]\n${seasonLines.join("\n")}`);
    }

    return dataParts.join("\n\n");
  } catch (err) {
    console.warn(
      "[intelligence] Failed to load intelligence data:",
      err instanceof Error ? err.message : String(err)
    );
    return "";
  }
}
