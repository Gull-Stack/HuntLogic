// =============================================================================
// HuntLogic — Normalize Worker
// =============================================================================
// BullMQ Worker that processes normalization jobs. Cross-state normalization,
// upserts into the appropriate tables, inserts into documents table for RAG,
// and enqueues embed jobs for semantic search.
// =============================================================================

import { Worker, type Job } from "bullmq";
import { eq, and } from "drizzle-orm";
import { db } from "../../../lib/db";
import {
  drawOdds,
  harvestStats,
  seasons,
  documents,
  states,
  species,
  huntUnits,
} from "../../../lib/db/schema";
import { redisConnection, embedQueue } from "../queue";
import { StateNormalizer } from "../normalizers/state-normalizer";
import { QualityScorer } from "../normalizers/quality-scorer";
import type { NormalizeJobData, ParsedDrawOdds, ParsedHarvestStats, ParsedSeason } from "../types";

const QUEUE_NAME = "ingestion-normalize";
const LOG_PREFIX = "[ingestion:normalize]";

const normalizer = new StateNormalizer();
const qualityScorer = new QualityScorer();

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processNormalizeJob(
  job: Job<NormalizeJobData>
): Promise<void> {
  const { sourceId, parsedData, docType, stateCode, speciesSlug } = job.data;

  console.log(
    `${LOG_PREFIX} Processing job ${job.id} — source: ${sourceId}, docType: ${docType}, state: ${stateCode}`
  );

  try {
    // Look up state ID
    const [stateRow] = await db
      .select({ id: states.id })
      .from(states)
      .where(eq(states.code, stateCode.toUpperCase()))
      .limit(1);

    if (!stateRow) {
      throw new Error(`State not found: ${stateCode}`);
    }
    const stateId = stateRow.id;

    // Look up species ID if provided
    let speciesId: string | undefined;
    if (speciesSlug) {
      const normalizedSlug = normalizer.normalizeSpecies(speciesSlug);
      const [speciesRow] = await db
        .select({ id: species.id })
        .from(species)
        .where(eq(species.slug, normalizedSlug))
        .limit(1);
      speciesId = speciesRow?.id;
    }

    // Score quality
    const qualityReport = qualityScorer.score(
      parsedData,
      docType.includes("draw") ? "draw_odds" : docType.includes("harvest") ? "harvest_stats" : "seasons",
      1, // authority tier 1 = official state agency
      parsedData.metadata.year
    );

    console.log(
      `${LOG_PREFIX} Quality score: ${qualityReport.overallScore} (completeness: ${qualityReport.completeness}, consistency: ${qualityReport.consistency})`
    );

    // Route to the appropriate upsert handler based on doc type
    let recordsUpserted = 0;

    if (docType.includes("draw") || parsedData.metadata.parser.includes("draw_odds")) {
      recordsUpserted = await upsertDrawOdds(
        parsedData.records as unknown as ParsedDrawOdds[],
        stateCode,
        stateId,
        sourceId
      );
    } else if (docType.includes("harvest") || parsedData.metadata.parser === "harvest_report") {
      recordsUpserted = await upsertHarvestStats(
        parsedData.records as unknown as ParsedHarvestStats[],
        stateCode,
        stateId,
        sourceId
      );
    } else if (docType.includes("season") || parsedData.metadata.parser === "season_dates") {
      recordsUpserted = await upsertSeasons(
        parsedData.records as unknown as ParsedSeason[],
        stateCode,
        stateId,
        sourceId
      );
    }

    console.log(
      `${LOG_PREFIX} Upserted ${recordsUpserted} records into ${docType} table`
    );

    // Also insert/update a document entry for RAG
    const documentId = await upsertDocument(
      sourceId,
      stateId,
      speciesId,
      docType,
      parsedData,
      qualityReport.overallScore
    );

    // Enqueue embed job for the document
    if (documentId) {
      await embedQueue.add(`embed:${documentId}`, {
        documentId,
      });
      console.log(`${LOG_PREFIX} Enqueued embed job for document ${documentId}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Job ${job.id} failed: ${errorMessage}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Draw Odds Upsert
// ---------------------------------------------------------------------------

async function upsertDrawOdds(
  records: ParsedDrawOdds[],
  stateCode: string,
  stateId: string,
  sourceId: string
): Promise<number> {
  const normalized = normalizer.normalizeDrawOdds(records, stateCode, sourceId);
  let count = 0;

  for (const record of normalized.records) {
    try {
      // Look up species ID
      const speciesSlug = (record as Record<string, unknown>).speciesSlug as string;
      const [speciesRow] = await db
        .select({ id: species.id })
        .from(species)
        .where(eq(species.slug, speciesSlug))
        .limit(1);

      if (!speciesRow) {
        console.warn(`${LOG_PREFIX} Species not found: ${speciesSlug}, skipping record`);
        continue;
      }

      // Look up hunt unit ID (optional)
      const unitCode = (record as Record<string, unknown>).unitCode as string;
      let huntUnitId: string | undefined;
      if (unitCode) {
        const [unitRow] = await db
          .select({ id: huntUnits.id })
          .from(huntUnits)
          .where(
            and(
              eq(huntUnits.stateId, stateId),
              eq(huntUnits.unitCode, unitCode),
              eq(huntUnits.speciesId, speciesRow.id)
            )
          )
          .limit(1);
        huntUnitId = unitRow?.id;
      }

      const r = record as Record<string, unknown>;

      await db
        .insert(drawOdds)
        .values({
          stateId,
          speciesId: speciesRow.id,
          huntUnitId: huntUnitId || null,
          year: r.year as number,
          residentType: r.residentType as string,
          weaponType: (r.weaponType as string) || null,
          choiceRank: (r.choiceRank as number) || null,
          totalApplicants: (r.totalApplicants as number) || null,
          totalTags: (r.totalTags as number) || null,
          minPointsDrawn: (r.minPointsDrawn as number) || null,
          maxPointsDrawn: (r.maxPointsDrawn as number) || null,
          avgPointsDrawn: (r.avgPointsDrawn as number) || null,
          drawRate: (r.drawRate as number) || null,
          sourceId,
          rawData: r.rawData as Record<string, unknown> || {},
        })
        .onConflictDoNothing();

      count++;
    } catch (error) {
      console.warn(
        `${LOG_PREFIX} Failed to upsert draw odds record: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Harvest Stats Upsert
// ---------------------------------------------------------------------------

async function upsertHarvestStats(
  records: ParsedHarvestStats[],
  stateCode: string,
  stateId: string,
  sourceId: string
): Promise<number> {
  const normalized = normalizer.normalizeHarvestStats(records, stateCode, sourceId);
  let count = 0;

  for (const record of normalized.records) {
    try {
      const speciesSlug = (record as Record<string, unknown>).speciesSlug as string;
      const [speciesRow] = await db
        .select({ id: species.id })
        .from(species)
        .where(eq(species.slug, speciesSlug))
        .limit(1);

      if (!speciesRow) continue;

      const unitCode = (record as Record<string, unknown>).unitCode as string;
      let huntUnitId: string | undefined;
      if (unitCode) {
        const [unitRow] = await db
          .select({ id: huntUnits.id })
          .from(huntUnits)
          .where(
            and(
              eq(huntUnits.stateId, stateId),
              eq(huntUnits.unitCode, unitCode),
              eq(huntUnits.speciesId, speciesRow.id)
            )
          )
          .limit(1);
        huntUnitId = unitRow?.id;
      }

      const r = record as Record<string, unknown>;

      await db
        .insert(harvestStats)
        .values({
          stateId,
          speciesId: speciesRow.id,
          huntUnitId: huntUnitId || null,
          year: r.year as number,
          weaponType: (r.weaponType as string) || null,
          totalHunters: (r.totalHunters as number) || null,
          totalHarvest: (r.totalHarvest as number) || null,
          successRate: (r.successRate as number) || null,
          avgDaysHunted: (r.avgDaysHunted as number) || null,
          trophyMetrics: (r.trophyMetrics as Record<string, unknown>) || null,
          sourceId,
          rawData: r.rawData as Record<string, unknown> || {},
        })
        .onConflictDoNothing();

      count++;
    } catch (error) {
      console.warn(
        `${LOG_PREFIX} Failed to upsert harvest stat: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Seasons Upsert
// ---------------------------------------------------------------------------

async function upsertSeasons(
  records: ParsedSeason[],
  stateCode: string,
  stateId: string,
  sourceId: string
): Promise<number> {
  const normalized = normalizer.normalizeSeasons(records, stateCode, sourceId);
  let count = 0;

  for (const record of normalized.records) {
    try {
      const speciesSlug = (record as Record<string, unknown>).speciesSlug as string;
      const [speciesRow] = await db
        .select({ id: species.id })
        .from(species)
        .where(eq(species.slug, speciesSlug))
        .limit(1);

      if (!speciesRow) continue;

      const unitCode = (record as Record<string, unknown>).unitCode as string | undefined;
      let huntUnitId: string | undefined;
      if (unitCode) {
        const [unitRow] = await db
          .select({ id: huntUnits.id })
          .from(huntUnits)
          .where(
            and(
              eq(huntUnits.stateId, stateId),
              eq(huntUnits.unitCode, unitCode),
              eq(huntUnits.speciesId, speciesRow.id)
            )
          )
          .limit(1);
        huntUnitId = unitRow?.id;
      }

      const r = record as Record<string, unknown>;

      await db
        .insert(seasons)
        .values({
          stateId,
          speciesId: speciesRow.id,
          huntUnitId: huntUnitId || null,
          year: r.year as number,
          seasonName: (r.seasonName as string) || null,
          weaponType: (r.weaponType as string) || null,
          startDate: (r.startDate as string) || null,
          endDate: (r.endDate as string) || null,
          tagType: (r.tagType as string) || null,
          quota: (r.quota as number) || null,
          config: {},
        })
        .onConflictDoNothing();

      count++;
    } catch (error) {
      console.warn(
        `${LOG_PREFIX} Failed to upsert season: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Document Upsert (for RAG)
// ---------------------------------------------------------------------------

async function upsertDocument(
  sourceId: string,
  stateId: string,
  speciesId: string | undefined,
  docType: string,
  parsedData: NormalizeJobData["parsedData"],
  qualityScore: number
): Promise<string | null> {
  try {
    // Build document content from parsed records
    const content = JSON.stringify(parsedData.records, null, 2);
    const title = `${parsedData.metadata.stateCode || "Unknown"} ${docType} ${parsedData.metadata.year || ""}`.trim();

    // Generate a content hash for deduplication
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const [doc] = await db
      .insert(documents)
      .values({
        sourceId,
        title,
        content,
        docType,
        stateId,
        speciesId: speciesId || null,
        year: parsedData.metadata.year || null,
        url: parsedData.metadata.sourceUrl || null,
        metadata: {
          parser: parsedData.metadata.parser,
          rowCount: parsedData.metadata.rowCount,
          qualityScore,
          parsedAt: parsedData.metadata.parsedAt,
        },
        contentHash,
        freshnessScore: qualityScore,
      })
      .onConflictDoNothing()
      .returning({ id: documents.id });

    return doc?.id || null;
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} Failed to upsert document: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Worker instance
// ---------------------------------------------------------------------------

export function createNormalizeWorker(): Worker<NormalizeJobData> {
  const worker = new Worker<NormalizeJobData>(
    QUEUE_NAME,
    processNormalizeJob,
    {
      connection: redisConnection,
      concurrency: parseInt(
        process.env.NORMALIZE_WORKER_CONCURRENCY || "3",
        10
      ),
    }
  );

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

  console.log(`${LOG_PREFIX} Worker started (concurrency: ${process.env.NORMALIZE_WORKER_CONCURRENCY || "3"})`);

  return worker;
}
