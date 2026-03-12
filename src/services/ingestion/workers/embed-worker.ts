// =============================================================================
// HuntLogic — Embed Worker
// =============================================================================
// BullMQ Worker that processes embedding jobs. Loads document content from DB,
// generates embeddings via AI client, and updates the document's vector column.
// =============================================================================

import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../../../lib/db";
import { documents } from "../../../lib/db/schema";
import { redisConnection } from "../queue";
import { QualityScorer } from "../normalizers/quality-scorer";
import type { EmbedJobData } from "../types";

const QUEUE_NAME = "ingestion:embed";
const LOG_PREFIX = "[ingestion:embed]";

const qualityScorer = new QualityScorer();

// ---------------------------------------------------------------------------
// Embedding generation placeholder
// ---------------------------------------------------------------------------

/**
 * Generate an embedding vector for the given text.
 *
 * TODO: Implement with actual embedding provider:
 *   - Voyage AI (preferred for RAG): voyage.embed(text, model='voyage-2')
 *   - OpenAI: openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
 *   - Local model via Ollama or HuggingFace
 *
 * Returns a 1536-dimensional vector (matching pgvector column config).
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  // Truncate text to ~8000 tokens (~32000 chars) for embedding model limits
  const truncated = text.slice(0, 32_000);

  if (truncated.length < 10) {
    console.warn(`${LOG_PREFIX} Text too short to embed (${truncated.length} chars)`);
    return null;
  }

  // --- PLACEHOLDER: Return null until embedding provider is configured ---
  // When ready, uncomment one of these implementations:

  // === Voyage AI ===
  // import Anthropic from "@anthropic-ai/sdk";
  // const voyageClient = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });
  // const result = await voyageClient.embed({ texts: [truncated], model: "voyage-2" });
  // return result.embeddings[0];

  // === OpenAI ===
  // import OpenAI from "openai";
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const result = await openai.embeddings.create({
  //   model: "text-embedding-3-small",
  //   input: truncated,
  //   dimensions: 1536,
  // });
  // return result.data[0].embedding;

  console.log(
    `${LOG_PREFIX} Embedding generation placeholder — configure VOYAGE_API_KEY or OPENAI_API_KEY`
  );
  return null;
}

// ---------------------------------------------------------------------------
// Worker processor
// ---------------------------------------------------------------------------

async function processEmbedJob(job: Job<EmbedJobData>): Promise<void> {
  const { documentId } = job.data;

  console.log(`${LOG_PREFIX} Processing job ${job.id} — document: ${documentId}`);

  try {
    // Load document from DB
    const [doc] = await db
      .select({
        id: documents.id,
        content: documents.content,
        title: documents.title,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!doc) {
      console.warn(`${LOG_PREFIX} Document not found: ${documentId}`);
      return;
    }

    if (!doc.content || doc.content.trim().length === 0) {
      console.warn(`${LOG_PREFIX} Document ${documentId} has no content — skipping`);
      return;
    }

    // Build text to embed (title + content)
    const textToEmbed = [doc.title, doc.content].filter(Boolean).join("\n\n");

    // Generate embedding
    const embedding = await generateEmbedding(textToEmbed);

    // Calculate freshness score
    const freshnessScore = qualityScorer.calculateFreshnessScore(
      doc.createdAt
    );

    // Update document
    const updateData: Record<string, unknown> = {
      freshnessScore,
      updatedAt: new Date(),
    };

    if (embedding) {
      updateData.embedding = embedding;
    }

    await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, documentId));

    console.log(
      `${LOG_PREFIX} Document ${documentId} updated — embedding: ${embedding ? "generated" : "skipped (no provider)"}, freshness: ${freshnessScore.toFixed(2)}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Job ${job.id} failed: ${errorMessage}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Worker instance
// ---------------------------------------------------------------------------

export function createEmbedWorker(): Worker<EmbedJobData> {
  const worker = new Worker<EmbedJobData>(QUEUE_NAME, processEmbedJob, {
    connection: redisConnection,
    concurrency: parseInt(process.env.EMBED_WORKER_CONCURRENCY || "2", 10),
    limiter: {
      max: 60,
      duration: 60_000, // 60 embeddings per minute (API rate limit protection)
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

  console.log(`${LOG_PREFIX} Worker started (concurrency: ${process.env.EMBED_WORKER_CONCURRENCY || "2"})`);

  return worker;
}
