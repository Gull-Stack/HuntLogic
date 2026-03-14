// =============================================================================
// HuntLogic — Ingestion Service Standalone Start Script
// =============================================================================
// Usage: npx tsx src/services/ingestion/start.ts
// Starts all workers, scheduler, and handles graceful shutdown.
// =============================================================================

import { startIngestionService, stopIngestionService, triggerSource } from "./index";
import { config } from "../../lib/config";
import { db } from "../../lib/db";
import { dataSources } from "../../lib/db/schema";
import { eq } from "drizzle-orm";

async function triggerAllSources() {
  const sources = await db
    .select({ id: dataSources.id, name: dataSources.name })
    .from(dataSources)
    .where(eq(dataSources.enabled, true));

  console.log(`[startup] Triggering ${sources.length} sources...`);
  for (const s of sources) {
    try {
      await triggerSource(s.id);
      console.log(`[startup]   ✓ ${s.name}`);
    } catch (e: any) {
      console.log(`[startup]   ✗ ${s.name} — ${e.message}`);
    }
  }
}

async function main() {
  console.log(`${config.app.name} Ingestion Service starting...\n`);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await stopIngestionService();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await startIngestionService();
    console.log("\nIngestion service is running. Press Ctrl+C to stop.\n");

    // Trigger all sources on deploy when TRIGGER_ON_DEPLOY=true
    if (process.env.TRIGGER_ON_DEPLOY === "true") {
      console.log("[startup] TRIGGER_ON_DEPLOY=true — firing immediate ingestion...");
      await triggerAllSources();
    }
  } catch (error) {
    console.error("Failed to start ingestion service:", error);
    process.exit(1);
  }
}

main();
