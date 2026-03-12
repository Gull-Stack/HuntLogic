// =============================================================================
// HuntLogic — Parse Worker
// =============================================================================
// BullMQ Worker that processes parse jobs. Dispatches to the correct parser
// based on the `parser` field, extracts structured data, and enqueues
// normalize jobs with the parsed results.
// =============================================================================

import { Worker, type Job } from "bullmq";
import { redisConnection, normalizeQueue } from "../queue";
import { getParser } from "../parsers";
import type { ParseJobData, NormalizeJobData, ParserConfig } from "../types";

const QUEUE_NAME = "ingestion-parse";
const LOG_PREFIX = "[ingestion:parse]";

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processParseJob(job: Job<ParseJobData>): Promise<void> {
  const { sourceId, rawContent, docType, parser: parserName, metadata } =
    job.data;

  console.log(
    `${LOG_PREFIX} Processing job ${job.id} — source: ${sourceId}, parser: ${parserName}, docType: ${docType}`
  );

  try {
    // Get the appropriate parser
    const parser = getParser(parserName);

    // Build parser config from job metadata
    const parserConfig: ParserConfig = {
      state_code: metadata.stateCode,
      species_slug: metadata.speciesSlug,
      year: metadata.year,
      column_mappings: metadata.columnMappings,
      table_selector: metadata.tableSelector,
    };

    // Parse the raw content
    const parsedResult = await parser.parse(rawContent, parserConfig);
    console.log(
      `${LOG_PREFIX} Parsed ${parsedResult.records.length} records (quality: ${parsedResult.qualityScore.toFixed(2)}, warnings: ${parsedResult.warnings.length})`
    );

    // Log warnings if any
    if (parsedResult.warnings.length > 0) {
      console.warn(
        `${LOG_PREFIX} Parse warnings for source ${sourceId}:\n${parsedResult.warnings.slice(0, 10).join("\n")}`
      );
      if (parsedResult.warnings.length > 10) {
        console.warn(
          `${LOG_PREFIX}   ... and ${parsedResult.warnings.length - 10} more warnings`
        );
      }
    }

    // Skip normalization if no records were parsed
    if (parsedResult.records.length === 0) {
      console.warn(
        `${LOG_PREFIX} No records parsed for source ${sourceId} — skipping normalization`
      );
      return;
    }

    // Skip if quality is extremely low
    if (parsedResult.qualityScore < 0.1) {
      console.warn(
        `${LOG_PREFIX} Quality score too low (${parsedResult.qualityScore}) — skipping normalization`
      );
      return;
    }

    // Determine the state code (required for normalization)
    const stateCode =
      metadata.stateCode ||
      parsedResult.metadata.stateCode ||
      "UNKNOWN";

    // Enqueue normalize job
    const normalizeJobData: NormalizeJobData = {
      sourceId,
      parsedData: parsedResult,
      docType,
      stateCode,
      speciesSlug: metadata.speciesSlug || parsedResult.metadata.speciesSlug,
    };

    await normalizeQueue.add(
      `normalize:${sourceId}:${docType}`,
      normalizeJobData,
      {
        priority: 2,
      }
    );

    console.log(
      `${LOG_PREFIX} Enqueued normalize job for source ${sourceId} (${parsedResult.records.length} records)`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Job ${job.id} failed: ${errorMessage}`);

    // Don't crash the worker — log and let BullMQ handle retry
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Worker instance
// ---------------------------------------------------------------------------

export function createParseWorker(): Worker<ParseJobData> {
  const worker = new Worker<ParseJobData>(QUEUE_NAME, processParseJob, {
    connection: redisConnection,
    concurrency: parseInt(process.env.PARSE_WORKER_CONCURRENCY || "5", 10),
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

  console.log(`${LOG_PREFIX} Worker started (concurrency: ${process.env.PARSE_WORKER_CONCURRENCY || "5"})`);

  return worker;
}
