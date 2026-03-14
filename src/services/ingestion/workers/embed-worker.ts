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
import { config } from "@/lib/config";

const QUEUE_NAME = "ingestion-embed";
const LOG_PREFIX = "[ingestion:embed]";

const qualityScorer = new QualityScorer();

// ---------------------------------------------------------------------------
// Embedding generation via configurable model (default: gemini-embedding-001)
// ---------------------------------------------------------------------------

import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(`${LOG_PREFIX} GEMINI_API_KEY not set — embeddings disabled`);
    return null;
  }
  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const truncated = text.slice(0, 32_000);

  if (truncated.length < 10) {
    console.warn(`${LOG_PREFIX} Text too short to embed (${truncated.length} chars)`);
    return null;
  }

  const ai = getGemini();
  if (!ai) return null;

  const result = await ai.models.embedContent({
    model: config.ai.embeddingModel,
    contents: truncated,
    config: { outputDimensionality: 768 },
  });

  return result.embeddings?.[0]?.values ?? null;
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
