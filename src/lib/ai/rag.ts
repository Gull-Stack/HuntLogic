/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * 1. Embedding generation via configurable model (default: gemini-embedding-001)
 * 2. Semantic search via cosine_similarity() on real[] columns
 * 3. Context assembly for Claude prompts
 */

import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { config } from "@/lib/config";

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (geminiClient) return geminiClient;
  geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return geminiClient;
}

export interface RetrievedDocument {
  id: string;
  title: string | null;
  content: string;
  relevanceScore: number;
  sourceUrl: string | null;
  docType: string | null;
  year: number | null;
}

/**
 * Generate a 768-dim embedding vector for a given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 32_000);
  const ai = getGemini();
  const result = await ai.models.embedContent({
    model: config.ai.embeddingModel,
    contents: truncated,
    config: { outputDimensionality: 768 },
  });
  return result.embeddings![0]!.values!;
}

/**
 * Search documents using cosine similarity on real[] embeddings.
 * Uses the cosine_similarity() PL/pgSQL function installed in the DB.
 */
export async function searchDocuments(
  query: string,
  limit: number = 5,
  minScore: number = 0.3
): Promise<RetrievedDocument[]> {
  const queryEmbedding = await generateEmbedding(query);
  const embeddingLiteral = `ARRAY[${queryEmbedding.join(",")}]::real[]`;

  const results = await db.execute(sql`
    SELECT
      id,
      title,
      content,
      url,
      doc_type,
      year,
      cosine_similarity(embedding, ${sql.raw(embeddingLiteral)}) AS score
    FROM documents
    WHERE embedding IS NOT NULL
    ORDER BY score DESC
    LIMIT ${limit}
  `);

  return (results as any[])
    .filter((row: any) => row.score >= minScore)
    .map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      relevanceScore: parseFloat(row.score),
      sourceUrl: row.url,
      docType: row.doc_type,
      year: row.year,
    }));
}

/**
 * Search documents filtered by state and/or species.
 */
export async function searchDocumentsFiltered(
  query: string,
  filters: { stateId?: string; speciesId?: string; docType?: string; year?: number },
  limit: number = 5,
  minScore: number = 0.3
): Promise<RetrievedDocument[]> {
  const queryEmbedding = await generateEmbedding(query);
  const embeddingLiteral = `ARRAY[${queryEmbedding.join(",")}]::real[]`;

  const conditions: string[] = ["embedding IS NOT NULL"];
  if (filters.stateId) conditions.push(`state_id = '${filters.stateId}'`);
  if (filters.speciesId) conditions.push(`species_id = '${filters.speciesId}'`);
  if (filters.docType) conditions.push(`doc_type = '${filters.docType}'`);
  if (filters.year) conditions.push(`year = ${filters.year}`);

  const whereClause = conditions.join(" AND ");

  const results = await db.execute(sql`
    SELECT
      id,
      title,
      content,
      url,
      doc_type,
      year,
      cosine_similarity(embedding, ${sql.raw(embeddingLiteral)}) AS score
    FROM documents
    WHERE ${sql.raw(whereClause)}
    ORDER BY score DESC
    LIMIT ${limit}
  `);

  return (results as any[])
    .filter((row: any) => row.score >= minScore)
    .map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      relevanceScore: parseFloat(row.score),
      sourceUrl: row.url,
      docType: row.doc_type,
      year: row.year,
    }));
}

/**
 * Assemble RAG context for a Claude prompt.
 * Retrieves relevant documents and formats them as XML context blocks.
 */
export async function assembleContext(
  query: string,
  maxDocuments: number = 5,
  filters?: { stateId?: string; speciesId?: string; docType?: string; year?: number }
): Promise<string> {
  const docs = filters
    ? await searchDocumentsFiltered(query, filters, maxDocuments)
    : await searchDocuments(query, maxDocuments);

  if (docs.length === 0) {
    return "";
  }

  const contextParts = docs.map((doc, index) => {
    const meta: string[] = [];
    if (doc.sourceUrl) meta.push(`source="${doc.sourceUrl}"`);
    if (doc.docType) meta.push(`type="${doc.docType}"`);
    if (doc.year) meta.push(`year="${doc.year}"`);
    meta.push(`relevance="${doc.relevanceScore.toFixed(3)}"`);

    const attrs = meta.join(" ");
    return `<document index="${index + 1}" ${attrs}>\n${doc.title ? `# ${doc.title}\n` : ""}${doc.content}\n</document>`;
  });

  return `<context>\n${contextParts.join("\n\n")}\n</context>`;
}
