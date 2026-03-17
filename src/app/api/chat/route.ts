// =============================================================================
// Public Chat API — Grizz (HuntLogic AI Concierge)
// =============================================================================
// POST /api/chat — Public endpoint for the landing page chat widget.
// No auth required. System prompt lives server-side.
//
// Tries OpenClaw gateway first (local dev), falls back to Anthropic SDK.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || "https://huntlogic.mysupertool.app";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

const SYSTEM_PROMPT = `You are Grizz, HuntLogic's AI hunting concierge on huntlogic.vercel.app. You are talking to a hunter or outdoor enthusiast who just landed on the website.

YOUR GOAL: Provide real value BEFORE asking for anything. Earn the next step, don't push for it.

CONVERSATION FLOW:
1. LISTEN — Ask what species they're after and what state(s) they hunt or want to hunt.
2. GIVE INSIGHT — Based on their answer, share specific, actionable advice: draw odds trends, point strategies, deadline awareness, unit recommendations.
3. BRIDGE TO PRODUCT — Connect their situation to what HuntLogic does: personalized playbooks, draw odds analysis, point tracking, deadline alerts, multi-year strategy.
4. SOFT CTA — "Want me to build you a custom playbook? Sign up free and I'll map out your best path to a tag."

WHAT YOU KNOW:
- Draw systems for all western states (CO, WY, MT, ID, NM, AZ, UT, NV, OR, WA)
- Preference point, bonus point, and squared bonus systems
- Point creep trends and historical draw odds
- Application deadlines and season structures
- OTC opportunities and leftover tag strategies
- Multi-year application strategies to maximize tag odds

RULES:
- Be direct, knowledgeable, authentic. Talk like a seasoned outfitter, not a salesman.
- Use specific numbers when you can: draw odds percentages, point thresholds, deadlines.
- DO NOT use emojis. Be sharp and credible.
- Keep responses under 4 sentences. Punchy. Conversational.
- NEVER fabricate statistics. If you're unsure, say so and recommend checking the state agency.
- When uncertain about specific data, be honest: "I'd need to check the latest numbers on that."
- You represent HuntLogic — AI-powered hunting intelligence that helps hunters never miss a hunt.`;

// =============================================================================
// POST handler
// =============================================================================

export async function POST(request: NextRequest) {
  // CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers });
  }

  const body = await request.json();
  const { messages } = body as { messages: { role: string; content: string }[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array required" },
      { status: 400, headers }
    );
  }

  // Rate limit: max 20 messages per conversation (prevent abuse on public endpoint)
  if (messages.length > 20) {
    return NextResponse.json(
      { reply: "You've been chatting a while! Sign up for a free account to keep the conversation going with your full hunter profile loaded." },
      { status: 200, headers }
    );
  }

  // Gateway first (OpenClaw via Cloudflare Tunnel), Anthropic SDK fallback
  try {
    const reply = await callGateway(messages);
    return NextResponse.json({ reply }, { headers });
  } catch (gwErr) {
    console.warn("[chat:public] Gateway unavailable:", (gwErr as Error).message);
    try {
      const reply = await callAnthropicDirect(messages);
      return NextResponse.json({ reply }, { headers });
    } catch (sdkErr) {
      console.error("[chat:public] All backends failed:", sdkErr);
      return NextResponse.json(
        { reply: "I'm having a moment. Try messaging me on Telegram @TeddyLogicBot — I'm always online there." },
        { status: 200, headers }
      );
    }
  }
}

// =============================================================================
// OpenClaw Gateway — local agent call (OpenAI-compatible)
// =============================================================================

async function callGateway(
  messages: { role: string; content: string }[]
): Promise<string> {
  const res = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      model: "openclaw:teddy",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 300,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Gateway returned ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from gateway");
  return text;
}

// =============================================================================
// Anthropic SDK fallback (production on Vercel)
// =============================================================================

async function callAnthropicDirect(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No ANTHROPIC_API_KEY configured");

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  // Convert chat history to Anthropic format
  const anthropicMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 300,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "Sorry, I couldn't generate a response.";
}
