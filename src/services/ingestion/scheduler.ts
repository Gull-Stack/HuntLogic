// =============================================================================
// HuntLogic — Ingestion Scheduler
// =============================================================================
// Reads all active/enabled data_sources from DB and creates BullMQ repeatable
// jobs based on each source's refresh_cadence. Also provides manual trigger.
// =============================================================================

import { eq, and } from "drizzle-orm";
import { db } from "../../lib/db";
import { dataSources } from "../../lib/db/schema";
import { fetchQueue } from "./queue";
import type { FetchJobData, ScraperConfig, EndpointConfig } from "./types";

const LOG_PREFIX = "[ingestion:scheduler]";

// ---------------------------------------------------------------------------
// Cadence → Cron mapping
// ---------------------------------------------------------------------------

const CADENCE_CRON: Record<string, string> = {
  daily: "0 6 * * *", // 6 AM daily
  weekly: "0 6 * * 1", // 6 AM Monday
  monthly: "0 6 1 * *", // 6 AM 1st of month
  annual: "0 6 1 1 *", // 6 AM January 1
};

// ---------------------------------------------------------------------------
// Track repeatable job keys for cleanup
// ---------------------------------------------------------------------------

let scheduledJobKeys: string[] = [];
let isRunning = false;

// ---------------------------------------------------------------------------
// Start Scheduler
// ---------------------------------------------------------------------------

export async function startScheduler(): Promise<void> {
  if (isRunning) {
    console.warn(`${LOG_PREFIX} Scheduler already running`);
    return;
  }

  console.log(`${LOG_PREFIX} Starting ingestion scheduler...`);

  try {
    // Load all active, enabled data sources
    const sources = await db
      .select()
      .from(dataSources)
      .where(
        and(
          eq(dataSources.enabled, true),
          eq(dataSources.status, "active")
        )
      );

    console.log(`${LOG_PREFIX} Found ${sources.length} active data sources`);

    // Clear any existing repeatable jobs from previous runs
    await cleanupRepeatableJobs();

    // Schedule each source's endpoints
    for (const source of sources) {
      try {
        const config = source.scraperConfig as ScraperConfig;

        if (!config || !config.endpoints || config.endpoints.length === 0) {
          console.warn(
            `${LOG_PREFIX} Source "${source.name}" (${source.id}) has no endpoints configured — skipping`
          );
          continue;
        }

        for (const endpoint of config.endpoints) {
          // Determine cron schedule: endpoint-level override > source cadence
          const cronExpression =
            endpoint.schedule ||
            CADENCE_CRON[source.refreshCadence] ||
            CADENCE_CRON.weekly;

          const jobName = `fetch:${source.id}:${endpoint.path}`;

          const jobData: FetchJobData = {
            sourceId: source.id,
            endpoint,
            config,
          };

          // Add repeatable job
          await fetchQueue.add(jobName, jobData, {
            repeat: {
              pattern: cronExpression,
            },
            jobId: `scheduled:${source.id}:${endpoint.path}`,
          });

          scheduledJobKeys.push(jobName);

          console.log(
            `${LOG_PREFIX}   Scheduled: "${source.name}" → ${endpoint.path} (${cronExpression})`
          );
        }
      } catch (error) {
        console.error(
          `${LOG_PREFIX} Failed to schedule source "${source.name}" (${source.id}): ${error}`
        );
      }
    }

    isRunning = true;
    console.log(
      `${LOG_PREFIX} Scheduler started — ${scheduledJobKeys.length} jobs scheduled`
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to start scheduler: ${error}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Stop Scheduler
// ---------------------------------------------------------------------------

export async function stopScheduler(): Promise<void> {
  if (!isRunning) {
    console.warn(`${LOG_PREFIX} Scheduler not running`);
    return;
  }

  console.log(`${LOG_PREFIX} Stopping scheduler...`);
  await cleanupRepeatableJobs();
  scheduledJobKeys = [];
  isRunning = false;
  console.log(`${LOG_PREFIX} Scheduler stopped`);
}

// ---------------------------------------------------------------------------
// Manual trigger for a specific source
// ---------------------------------------------------------------------------

export async function triggerSource(sourceId: string): Promise<void> {
  console.log(`${LOG_PREFIX} Manual trigger for source: ${sourceId}`);

  const [source] = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.id, sourceId))
    .limit(1);

  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  const config = source.scraperConfig as ScraperConfig;

  if (!config || !config.endpoints || config.endpoints.length === 0) {
    throw new Error(`Source "${source.name}" has no endpoints configured`);
  }

  // Enqueue immediate fetch jobs for all endpoints
  for (const endpoint of config.endpoints) {
    const jobData: FetchJobData = {
      sourceId: source.id,
      endpoint,
      config,
    };

    await fetchQueue.add(
      `manual:${source.id}:${endpoint.path}`,
      jobData,
      {
        priority: 1, // highest priority for manual triggers
      }
    );

    console.log(
      `${LOG_PREFIX} Triggered: "${source.name}" → ${endpoint.path}`
    );
  }
}

// ---------------------------------------------------------------------------
// Trigger all sources for a specific state
// ---------------------------------------------------------------------------

export async function triggerState(stateCode: string): Promise<number> {
  console.log(`${LOG_PREFIX} Manual trigger for state: ${stateCode}`);

  const sources = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.enabled, true));

  let triggered = 0;

  for (const source of sources) {
    const config = source.scraperConfig as ScraperConfig;
    if (config?.state_code?.toUpperCase() === stateCode.toUpperCase()) {
      await triggerSource(source.id);
      triggered++;
    }
  }

  console.log(`${LOG_PREFIX} Triggered ${triggered} sources for state ${stateCode}`);
  return triggered;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanupRepeatableJobs(): Promise<void> {
  try {
    const repeatableJobs = await fetchQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.key) {
        await fetchQueue.removeRepeatableByKey(job.key);
      }
    }
    console.log(
      `${LOG_PREFIX} Cleaned up ${repeatableJobs.length} repeatable jobs`
    );
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} Repeatable job cleanup error: ${error}`
    );
  }
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export function isSchedulerRunning(): boolean {
  return isRunning;
}

export function getScheduledJobCount(): number {
  return scheduledJobKeys.length;
}
