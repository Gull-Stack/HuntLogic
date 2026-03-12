// =============================================================================
// Ingestion Trigger — POST endpoint to kick off BullMQ ingestion pipeline
// =============================================================================
// Triggers state-level (and optionally source-level) ingestion jobs.
// Protected by CRON_SECRET bearer token.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

const DEFAULT_STATES = ["AZ", "WY", "CO", "NV", "MT"];

// =============================================================================
// POST /api/v1/ingestion/trigger — Trigger ingestion for priority states
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { states, sourceId } = body as {
      states?: string[];
      sourceId?: string;
    };

    const targetStates = states?.length ? states : DEFAULT_STATES;

    // Lazy-import to avoid BullMQ queue initialization at build time
    const { triggerState, triggerSource } = await import("@/services/ingestion");

    // Trigger ingestion for each state
    const stateResults: Array<{ state: string; status: string }> = [];

    for (const state of targetStates) {
      try {
        await triggerState(state);
        stateResults.push({ state, status: "queued" });
        console.log(`[ingestion/trigger] Queued state: ${state}`);
      } catch (err) {
        console.error(`[ingestion/trigger] Failed to queue state ${state}:`, err);
        stateResults.push({ state, status: "failed" });
      }
    }

    // Optionally trigger a specific source
    let sourceResult: { sourceId: string; status: string } | null = null;

    if (sourceId) {
      try {
        await triggerSource(sourceId);
        sourceResult = { sourceId, status: "queued" };
        console.log(`[ingestion/trigger] Queued source: ${sourceId}`);
      } catch (err) {
        console.error(`[ingestion/trigger] Failed to queue source ${sourceId}:`, err);
        sourceResult = { sourceId, status: "failed" };
      }
    }

    const statesQueued = stateResults.filter((r) => r.status === "queued").length;
    const statesFailed = stateResults.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      states: {
        total: targetStates.length,
        queued: statesQueued,
        failed: statesFailed,
        results: stateResults,
      },
      ...(sourceResult && { source: sourceResult }),
    });
  } catch (error) {
    console.error("[ingestion/trigger] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Ingestion trigger failed" },
      { status: 500 }
    );
  }
}
