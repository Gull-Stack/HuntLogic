// =============================================================================
// Chat API — Teddy Concierge via OpenClaw Gateway
// =============================================================================
// POST /api/v1/chat — Send message to Teddy, get response
//
// Routes through the OpenClaw gateway when available (local dev),
// or falls back to direct Anthropic SDK if ANTHROPIC_API_KEY is set.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  hunterPreferences,
  pointHoldings,
  recommendations,
  playbooks,
  states,
  species,
  huntUnits,
} from "@/lib/db/schema";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const maxDuration = 60;

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message, history = [] } = body as {
    message: string;
    history: { role: string; content: string }[];
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Load hunter profile context from DB
  const profileContext = await loadHunterProfileContext(session.user.id);

  // Build context from history
  const aiName = config.app.aiAssistantName;
  const contextLines = history
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Hunter" : aiName}: ${m.content}`)
    .join("\n");

  // Assemble full message: profile context + conversation history + current message
  const messageParts: string[] = [];
  if (profileContext) {
    messageParts.push(profileContext);
  }
  if (contextLines) {
    messageParts.push(`Previous conversation:\n${contextLines}`);
  }
  messageParts.push(`Hunter: ${message.trim()}`);

  const fullMessage = messageParts.join("\n\n");

  // Try OpenClaw gateway first, then fall back to direct SDK
  try {
    const reply = await callOpenClawGateway(fullMessage);
    return NextResponse.json({ text: reply });
  } catch (gatewayErr) {
    console.warn(
      "[chat] OpenClaw gateway unavailable, trying direct SDK:",
      gatewayErr instanceof Error ? gatewayErr.message : String(gatewayErr)
    );

    // Fallback: direct Anthropic SDK (if key is available)
    try {
      const reply = await callAnthropicDirect(fullMessage);
      return NextResponse.json({ text: reply });
    } catch (sdkErr) {
      console.error("[chat] All backends failed:", sdkErr);
      return NextResponse.json(
        { error: `${config.app.aiAssistantName} is currently unavailable. Try messaging him on Telegram: ${config.app.telegramBot}` },
        { status: 503 }
      );
    }
  }
}

// =============================================================================
// Hunter Profile Context Loader
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

    // Group preferences by category for readable formatting
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

    // Build preferences line
    const prefParts: string[] = [];
    if (speciesInterests.length > 0) {
      // Attach state interests to species if both exist
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
      const recs = await db
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

      topRecs = recs;
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
      "[chat] Failed to load hunter profile context:",
      err instanceof Error ? err.message : String(err)
    );
    // Non-fatal — Teddy can still respond without profile context
    return "";
  }
}

// =============================================================================
// OpenClaw Gateway — local agent call
// =============================================================================

async function callOpenClawGateway(message: string): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/api/agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      agent: "teddy",
      message,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok) {
    throw new Error(`Gateway returned ${res.status}`);
  }

  const data = await res.json();

  // OpenClaw gateway response format
  const text =
    data?.result?.payloads?.[0]?.text ||
    data?.result?.text ||
    data?.text ||
    "";

  if (!text) {
    throw new Error("Empty response from gateway");
  }

  return text;
}

// =============================================================================
// Direct Anthropic SDK fallback
// =============================================================================

async function callAnthropicDirect(message: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("No ANTHROPIC_API_KEY configured");
  }

  // Dynamic import to avoid build errors when SDK isn't needed
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: config.ai.model,
    max_tokens: 4096,
    temperature: 0.7,
    system: `You are ${config.app.aiAssistantName}, the AI concierge for ${config.app.brandName} — a national hunting guide powered by real state agency data. You are knowledgeable, direct, and friendly — like a seasoned outfitter who genuinely wants hunters to fill their tags. Use specific numbers when available. When uncertain, say so clearly.`,
    messages: [{ role: "user", content: message }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "Sorry, I couldn't generate a response.";
}

export async function GET() {
  return NextResponse.json({
    concierge: config.app.aiAssistantName,
    telegram: config.app.telegramBot,
    status: "online",
  });
}
