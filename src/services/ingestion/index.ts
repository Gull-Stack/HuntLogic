// =============================================================================
// HuntLogic — Ingestion Service Entry Point
// =============================================================================
// Initializes all BullMQ queues, starts workers, starts the scheduler,
// and provides graceful shutdown.
// =============================================================================

import type { Worker } from "bullmq";
import {
  fetchQueue,
  parseQueue,
  normalizeQueue,
  embedQueue,
  closeQueues,
  checkQueueHealth,
  redisConnection,
} from "./queue";
import { createFetchWorker } from "./workers/fetch-worker";
import { createParseWorker } from "./workers/parse-worker";
import { createNormalizeWorker } from "./workers/normalize-worker";
import { createEmbedWorker } from "./workers/embed-worker";
import {
  startScheduler,
  stopScheduler,
  triggerSource,
  triggerState,
  isSchedulerRunning,
  getScheduledJobCount,
} from "./scheduler";

const LOG_PREFIX = "[ingestion:service]";

// ---------------------------------------------------------------------------
// Worker references for shutdown
// ---------------------------------------------------------------------------

let workers: Worker[] = [];
let isServiceRunning = false;

// ---------------------------------------------------------------------------
// Start Ingestion Service
// ---------------------------------------------------------------------------

export async function startIngestionService(): Promise<void> {
  if (isServiceRunning) {
    console.warn(`${LOG_PREFIX} Ingestion service already running`);
    return;
  }

  console.log(`${LOG_PREFIX} ==============================`);
  console.log(`${LOG_PREFIX} Starting HuntLogic Ingestion Service`);
  console.log(`${LOG_PREFIX} ==============================`);

  // 1. Check queue health (verifies Redis connectivity)
  console.log(`${LOG_PREFIX} Checking queue health...`);
  const health = await checkQueueHealth();
  const allHealthy = Object.values(health).every(Boolean);

  if (!allHealthy) {
    console.error(`${LOG_PREFIX} Queue health check failed:`, health);
    throw new Error("Failed to connect to Redis queues");
  }
  console.log(`${LOG_PREFIX} All queues healthy`);

  // 2. Start workers
  console.log(`${LOG_PREFIX} Starting workers...`);
  const fetchWorker = createFetchWorker();
  const parseWorker = createParseWorker();
  const normalizeWorker = createNormalizeWorker();
  const embedWorker = createEmbedWorker();

  workers = [fetchWorker, parseWorker, normalizeWorker, embedWorker];
  console.log(`${LOG_PREFIX} All 4 workers started`);

  // 3. Start the scheduler
  console.log(`${LOG_PREFIX} Starting scheduler...`);
  await startScheduler();

  isServiceRunning = true;

  console.log(`${LOG_PREFIX} ==============================`);
  console.log(`${LOG_PREFIX} Ingestion Service RUNNING`);
  console.log(`${LOG_PREFIX}   Workers: 4 (fetch, parse, normalize, embed)`);
  console.log(`${LOG_PREFIX}   Scheduled jobs: ${getScheduledJobCount()}`);
  console.log(`${LOG_PREFIX} ==============================`);
}

// ---------------------------------------------------------------------------
// Stop Ingestion Service (graceful shutdown)
// ---------------------------------------------------------------------------

export async function stopIngestionService(): Promise<void> {
  if (!isServiceRunning) {
    console.warn(`${LOG_PREFIX} Ingestion service not running`);
    return;
  }

  console.log(`${LOG_PREFIX} Shutting down ingestion service...`);

  // 1. Stop scheduler (no new jobs)
  await stopScheduler();
  console.log(`${LOG_PREFIX} Scheduler stopped`);

  // 2. Close workers (wait for current jobs to finish)
  console.log(`${LOG_PREFIX} Closing workers...`);
  await Promise.all(
    workers.map(async (worker) => {
      try {
        await worker.close();
      } catch (error) {
        console.warn(
          `${LOG_PREFIX} Worker close error: ${error}`
        );
      }
    })
  );
  workers = [];
  console.log(`${LOG_PREFIX} All workers closed`);

  // 3. Close queues
  await closeQueues();

  isServiceRunning = false;
  console.log(`${LOG_PREFIX} Ingestion service shut down`);
}

// ---------------------------------------------------------------------------
// Service status
// ---------------------------------------------------------------------------

export async function getIngestionStatus(): Promise<{
  running: boolean;
  schedulerRunning: boolean;
  scheduledJobs: number;
  workers: number;
  queueHealth: Record<string, boolean>;
  queueStats: {
    fetch: Record<string, number>;
    parse: Record<string, number>;
    normalize: Record<string, number>;
    embed: Record<string, number>;
  };
}> {
  const [health, fetchCounts, parseCounts, normalizeCounts, embedCounts] =
    await Promise.all([
      checkQueueHealth(),
      fetchQueue.getJobCounts().catch(() => ({})),
      parseQueue.getJobCounts().catch(() => ({})),
      normalizeQueue.getJobCounts().catch(() => ({})),
      embedQueue.getJobCounts().catch(() => ({})),
    ]);

  return {
    running: isServiceRunning,
    schedulerRunning: isSchedulerRunning(),
    scheduledJobs: getScheduledJobCount(),
    workers: workers.length,
    queueHealth: health,
    queueStats: {
      fetch: fetchCounts as Record<string, number>,
      parse: parseCounts as Record<string, number>,
      normalize: normalizeCounts as Record<string, number>,
      embed: embedCounts as Record<string, number>,
    },
  };
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

// Queue access
export {
  fetchQueue,
  parseQueue,
  normalizeQueue,
  embedQueue,
  redisConnection,
} from "./queue";

// Scheduler
export { triggerSource, triggerState } from "./scheduler";

// Adapters
export { getAdapter, registerAdapter, listAdapters } from "./adapters";

// Parsers
export { getParser, registerParser, listParsers } from "./parsers";

// Normalizers
export { StateNormalizer } from "./normalizers/state-normalizer";
export { QualityScorer } from "./normalizers/quality-scorer";

// Types
export type {
  ScraperConfig,
  EndpointConfig,
  RateLimitConfig,
  RetryConfig,
  RawFetchResult,
  ParsedResult,
  ParsedDrawOdds,
  ParsedHarvestStats,
  ParsedSeason,
  NormalizedData,
  QualityReport,
  QualityFlag,
  FetchJobData,
  ParseJobData,
  NormalizeJobData,
  EmbedJobData,
  AdapterName,
  ParserName,
  ParserConfig,
  PaginationConfig,
  AuthConfig,
} from "./types";
