import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runSimulation } from "@/services/simulation";
import { compareScenarios } from "@/services/simulation/scenarios";
import { config } from "@/lib/config";

// Simple in-memory rate limiter
const rateLimiter = new Map<string, number[]>();
const MAX_REQUESTS = config.rateLimit.simulationMaxPerMin;
const WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const userId = session.user.id;
  const now = Date.now();
  const timestamps = rateLimiter.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 5 simulations per minute." },
      { status: 429 }
    );
  }

  recent.push(now);
  rateLimiter.set(userId, recent);

  try {
    const body = await request.json();
    const { scenarios, yearsForward = 10 } = body;

    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      return NextResponse.json(
        { error: "At least one scenario is required" },
        { status: 400 }
      );
    }

    if (scenarios.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 scenarios allowed" },
        { status: 400 }
      );
    }

    const results = await runSimulation(scenarios, yearsForward);
    const comparison = compareScenarios(results);

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("[api/simulation] Error:", error);
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}
