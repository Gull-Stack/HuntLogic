// =============================================================================
// HuntLogic — BullMQ Queue Setup
// =============================================================================
// Named queues for the 4-stage ingestion pipeline:
//   fetch → parse → normalize → embed
// =============================================================================

import { Queue, type ConnectionOptions } from "bullmq";
import type {
  FetchJobData,
  ParseJobData,
  NormalizeJobData,
  EmbedJobData,
} from "./types";

// ---------------------------------------------------------------------------
// Redis Connection
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function parseRedisUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parseInt(parsed.port || "6379", 10),
    password: parsed.password || undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.slice(1) || "0", 10) : 0,
  };
}

export const redisConnection: ConnectionOptions = parseRedisUrl(REDIS_URL);

// ---------------------------------------------------------------------------
// Default Job Options
// ---------------------------------------------------------------------------

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  },
  removeOnComplete: {
    count: 1000,
  },
  removeOnFail: {
    count: 5000,
  },
};

// ---------------------------------------------------------------------------
// Queue Instances
// ---------------------------------------------------------------------------

export const fetchQueue = new Queue<FetchJobData>("ingestion-fetch", {
  connection: redisConnection,
  defaultJobOptions,
});

export const parseQueue = new Queue<ParseJobData>("ingestion-parse", {
  connection: redisConnection,
  defaultJobOptions,
});

export const normalizeQueue = new Queue<NormalizeJobData>(
  "ingestion-normalize",
  {
    connection: redisConnection,
    defaultJobOptions,
  }
);

export const embedQueue = new Queue<EmbedJobData>("ingestion-embed", {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2, // embedding failures are less critical
  },
});

// ---------------------------------------------------------------------------
// Queue health check
// ---------------------------------------------------------------------------

export async function checkQueueHealth(): Promise<{
  fetch: boolean;
  parse: boolean;
  normalize: boolean;
  embed: boolean;
}> {
  const results = await Promise.allSettled([
    fetchQueue.getJobCounts(),
    parseQueue.getJobCounts(),
    normalizeQueue.getJobCounts(),
    embedQueue.getJobCounts(),
  ]);

  return {
    fetch: results[0].status === "fulfilled",
    parse: results[1].status === "fulfilled",
    normalize: results[2].status === "fulfilled",
    embed: results[3].status === "fulfilled",
  };
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

export async function closeQueues(): Promise<void> {
  await Promise.all([
    fetchQueue.close(),
    parseQueue.close(),
    normalizeQueue.close(),
    embedQueue.close(),
  ]);
  console.log("[ingestion-queue] All queues closed");
}
