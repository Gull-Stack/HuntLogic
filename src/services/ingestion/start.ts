// =============================================================================
// HuntLogic — Ingestion Service Standalone Start Script
// =============================================================================
// Usage: npx tsx src/services/ingestion/start.ts
// Starts all workers, scheduler, and handles graceful shutdown.
// =============================================================================

import { startIngestionService, stopIngestionService } from "./index";

async function main() {
  console.log("HuntLogic Ingestion Service starting...\n");

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
  } catch (error) {
    console.error("Failed to start ingestion service:", error);
    process.exit(1);
  }
}

main();
