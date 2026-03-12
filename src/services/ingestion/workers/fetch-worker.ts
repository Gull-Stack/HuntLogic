// =============================================================================
// HuntLogic — Fetch Worker
// =============================================================================
// BullMQ Worker that processes fetch jobs. Loads source config from DB,
// dispatches to the correct adapter, and enqueues parse jobs on success.
// =============================================================================

import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { dataSources } from "../../../lib/db/schema";
import { redisConnection, parseQueue } from "../queue";
import { getAdapter } from "../adapters";
import type { FetchJobData, ScraperConfig, ParseJobData } from "../types";

const QUEUE_NAME = "ingestion:fetch";
const LOG_PREFIX = "[ingestion:fetch]";

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processFetchJob(job: Job<FetchJobData>): Promise<void> {
  const { sourceId, endpoint, config } = job.data;

  console.log(
    `${LOG_PREFIX} Processing job ${job.id} — source: ${sourceId}, path: ${endpoint.path}`
  );

  try {
    // Validate config
    const adapter = getAdapter(config.adapter);
    if (!adapter.validateConfig(config)) {
      throw new Error(`Invalid scraper config for adapter "${config.adapter}"`);
    }

    // Execute the fetch
    const result = await adapter.fetch(endpoint, config);

    console.log(
      `${LOG_PREFIX} Fetched ${result.byteSize} bytes from ${result.url}`
    );

    // Update data_sources.last_fetched
    await db
      .update(dataSources)
      .set({
        lastFetched: new Date(),
        lastSuccess: new Date(),
        errorCount: 0,
        lastError: null,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(dataSources.id, sourceId));

    // Determine the doc type from endpoint config
    const docType = endpoint.doc_type || inferDocType(endpoint.parser);

    // Enqueue parse job
    const parseJobData: ParseJobData = {
      sourceId,
      rawContent: result.content,
      docType,
      parser: endpoint.parser,
      metadata: {
        url: result.url,
        fetchedAt: result.fetchedAt,
        stateCode: config.state_code,
        speciesSlug: config.species_slugs?.[0],
        year: endpoint.params.year
          ? parseInt(endpoint.params.year)
          : undefined,
        objectStorageKey: result.objectStorageKey,
      },
    };

    await parseQueue.add(
      `parse:${sourceId}:${endpoint.path}`,
      parseJobData,
      {
        priority: getPriority(config),
      }
    );

    console.log(
      `${LOG_PREFIX} Enqueued parse job for source ${sourceId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Job ${job.id} failed: ${errorMessage}`);

    // Update error tracking on the data source
    try {
      const [source] = await db
        .select({ errorCount: dataSources.errorCount })
        .from(dataSources)
        .where(eq(dataSources.id, sourceId))
        .limit(1);

      const newErrorCount = (source?.errorCount || 0) + 1;
      const newStatus = newErrorCount > 5 ? "error" : "active";

      await db
        .update(dataSources)
        .set({
          lastFetched: new Date(),
          errorCount: newErrorCount,
          lastError: errorMessage,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(dataSources.id, sourceId));

      if (newStatus === "error") {
        console.warn(
          `${LOG_PREFIX} Source ${sourceId} marked as error after ${newErrorCount} consecutive failures`
        );
      }
    } catch (dbError) {
      console.error(
        `${LOG_PREFIX} Failed to update error state for source ${sourceId}: ${dbError}`
      );
    }

    throw error; // Re-throw so BullMQ handles retry
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferDocType(parser: string): string {
  if (parser.includes("draw_odds")) return "draw_report";
  if (parser.includes("harvest")) return "harvest_report";
  if (parser.includes("season")) return "season_summary";
  if (parser.includes("regulation")) return "regulation";
  return "document";
}

function getPriority(config: ScraperConfig): number {
  // Lower number = higher priority in BullMQ
  // State agencies get highest priority
  if (config.adapter === "api_json") return 1;
  if (config.adapter === "web_scraper") return 2;
  if (config.adapter === "pdf_download") return 3;
  return 5;
}

// ---------------------------------------------------------------------------
// Worker instance
// ---------------------------------------------------------------------------

export function createFetchWorker(): Worker<FetchJobData> {
  const worker = new Worker<FetchJobData>(QUEUE_NAME, processFetchJob, {
    connection: redisConnection,
    concurrency: parseInt(process.env.FETCH_WORKER_CONCURRENCY || "3", 10),
    limiter: {
      max: 10,
      duration: 60_000, // 10 jobs per minute globally
    },
  });

  worker.on("completed", (job) => {
    console.log(`${LOG_PREFIX} Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `${LOG_PREFIX} Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`
    );
  });

  worker.on("error", (err) => {
    console.error(`${LOG_PREFIX} Worker error: ${err.message}`);
  });

  console.log(`${LOG_PREFIX} Worker started (concurrency: ${process.env.FETCH_WORKER_CONCURRENCY || "3"})`);

  return worker;
}
