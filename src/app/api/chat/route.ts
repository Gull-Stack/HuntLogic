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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const headers = CORS_HEADERS;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }
  const { messages } = body as { messages: { role: string; content: string }[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages array required" },
      { status: 400, headers }
    );
  }

  for (const message of messages) {
    if (
      typeof message?.content !== "string" ||
      message.content.length === 0 ||
      message.content.length > 4000
    ) {
      return NextResponse.json(
        { error: "Message must be between 1 and 4000 characters" },
        { status: 400, headers }
      );
    }
  }

  // Rate limit: max 20 messages per conversation (prevent abuse on public endpoint)
  if (messages.length > 20) {
    return NextResponse.json(
      { reply: "You've been chatting a while! Sign up for a free account to keep the conversation going with your full hunter profile loaded." },
      { status: 200, headers }
    );
  }

  // Gateway first (OpenClaw via Cloudflare Tunnel), then Anthropic, Gemini, OpenAI
  try {
    const reply = await callGateway(messages);
    return NextResponse.json({ reply }, { headers });
  } catch (gwErr) {
    console.warn("[chat:public] Gateway unavailable:", (gwErr as Error).message);

    try {
      const reply = await callAnthropicDirect(messages);
      return NextResponse.json({ reply }, { headers });
    } catch (anthropicErr) {
      console.warn("[chat:public] Anthropic unavailable:", (anthropicErr as Error).message);

      try {
        const reply = await callGeminiDirect(messages);
        return NextResponse.json({ reply }, { headers });
      } catch (geminiErr) {
        console.warn("[chat:public] Gemini unavailable:", (geminiErr as Error).message);

        try {
          const reply = await callOpenAIDirect(messages);
          return NextResponse.json({ reply }, { headers });
        } catch (openaiErr) {
          console.error("[chat:public] All backends failed:", openaiErr);
          return NextResponse.json(
            { reply: "I'm having a moment. Try messaging me on Telegram @TeddyLogicBot — I'm always online there." },
            { status: 200, headers }
          );
        }
      }
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
    signal: AbortSignal.timeout(15000),
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
  const client = new Anthropic({ apiKey, timeout: 20_000 });

  // Convert chat history to Anthropic format
  const anthropicMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (anthropicMessages.length === 0) {
    throw new Error("No valid messages for Anthropic");
  }

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

// =============================================================================
// OpenAI / Codex fallback
// =============================================================================

async function callOpenAIDirect(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No OPENAI_API_KEY configured");

  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, timeout: 20_000 });

  const typedMessages = messages.map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...typedMessages,
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const text = completion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from OpenAI");

  return text;
}

// Gemini REST fallback
// =============================================================================

async function callGeminiDirect(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No GEMINI_API_KEY configured");

  const model = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";
  if (!/^[\w.-]+$/.test(model)) {
    throw new Error("Invalid GEMINI_CHAT_MODEL");
  }

  const geminiContents = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  if (geminiContents.length === 0 || geminiContents[0]?.role !== "user") {
    throw new Error("Cannot form valid Gemini turn sequence");
  }

  type GeminiTurn = { role: "user" | "model"; parts: { text: string }[] };
  const mergedContents = geminiContents.reduce<GeminiTurn[]>(
    (acc, current) => {
      const prev = acc[acc.length - 1];
      const turn: GeminiTurn = {
        role: current.role === "model" ? "model" : "user",
        parts: [...current.parts],
      };
      if (prev && prev.role === turn.role) {
        prev.parts.push(...turn.parts);
      } else {
        acc.push(turn);
      }
      return acc;
    },
    []
  );

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: mergedContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(20000),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return text;
}
