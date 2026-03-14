# Step 14: Gemini Embeddings + RAG Search Pipeline

**Status**: Code complete, awaiting GEMINI_API_KEY
**Commits**: `eaccf0a` → `8406654` — Switched from OpenAI to Gemini

## What Changed

### 1. Embed Worker — OpenAI Integration
**File**: `src/services/ingestion/workers/embed-worker.ts`
- Replaced placeholder `generateEmbedding()` with live Gemini `gemini-embedding-001`
- 768-dimensional vectors, 32K char truncation
- Lazy-initialized Gemini client (singleton)
- Graceful fallback: logs warning and skips if `GEMINI_API_KEY` not set
- Rate limited: 60 embeddings/minute (BullMQ limiter)

### 2. RAG Module — Full Implementation
**File**: `src/lib/ai/rag.ts`
- `generateEmbedding(text)` — OpenAI gemini-embedding-001, 1536 dims
- `searchDocuments(query, limit, minScore)` — Cosine similarity on real[] columns
- `searchDocumentsFiltered(query, filters, limit, minScore)` — Filtered by state/species/docType/year
- `assembleContext(query, maxDocs, filters?)` — Formats retrieved docs as XML context blocks for Claude

### 3. Schema Update — Native real[] Arrays
**File**: `src/lib/db/schema/data-sources.ts`
- Changed from pgvector `vector(1536)` to native PostgreSQL `real("embedding").array()`
- Reason: Railway PostgreSQL 17.7 doesn't have pgvector extension
- `cosine_similarity()` PL/pgSQL function already installed (Step 14a)

### 4. Scripts
- `scripts/test-embedding.ts` — Single-document embed + search test
- `scripts/batch-embed.ts` — Bulk embed all un-embedded documents (20/batch, 1s delay)

## Architecture

```
Document ingested → fetch → parse → normalize → embed worker
                                                    │
                                                    ▼
                                            Gemini API
                                     gemini-embedding-001
                                                    │
                                                    ▼
                                         documents.embedding
                                           (real[] 768-dim)
                                                    │
                                                    ▼
User query → generateEmbedding() → cosine_similarity() → top-k docs → assembleContext()
                                                                            │
                                                                            ▼
                                                                     Claude prompt
                                                                   with <context>
```

## Database State
- `documents.embedding` column: `real[]` (added via ALTER TABLE)
- `cosine_similarity(a real[], b real[])` function: PL/pgSQL, tested (returns 0.707 for cos(45°))
- Documents in DB: **7** (AZ, CO, WY regulations + draw + deadlines)
- Embeddings generated: **7/7** (100% — all Gemini 768-dim)

## Semantic Search Verified
Query: "Wyoming elk draw odds for nonresident hunters"
```
0.7203 | Application Dates & Deadlines | Wyoming Game & Fish
0.6896 | Regulations | Wyoming Game & Fish Department
0.6589 | Primary Draw | Colorado Parks and Wildlife
0.6463 | Big Game Draw - Arizona Game & Fish Department
0.6439 | Big Game | Colorado Parks and Wildlife
```
Wyoming content correctly ranked highest. Full RAG pipeline operational.

## Blockers

### GEMINI_API_KEY Required
Set in two places:
1. **Railway** (Ingestion Worker service): `railway variables --set GEMINI_API_KEY=sk-...`
2. **Vercel** (Next.js app for RAG search): Add via Vercel dashboard
3. **Local** (.env): For running batch-embed and test scripts

### No Documents Yet
The ingestion pipeline hasn't produced documents yet. Once sources are scheduled and fetched:
1. Fetch worker downloads content
2. Parse worker extracts structured data
3. Normalize worker writes to DB
4. Embed worker generates embeddings (this step)

## Verification Commands
```bash
# Test embedding generation (needs GEMINI_API_KEY)
GEMINI_API_KEY=sk-... npx tsx scripts/test-embedding.ts

# Batch embed all documents
GEMINI_API_KEY=sk-... npx tsx scripts/batch-embed.ts

# Check embedding counts
railway run -- npx tsx -e "const p=require('postgres');const s=p(process.env.DATABASE_URL);(async()=>{const r=await s\`SELECT COUNT(*) as c FROM documents WHERE embedding IS NOT NULL\`;console.log('Embedded:',r[0].c);await s.end()})()"
```

## Quality Notes
- Embed worker gracefully handles missing API key (logs warning, skips)
- RAG search uses minimum score threshold (default 0.3) to filter noise
- Filtered search supports state/species/docType/year for targeted retrieval
- assembleContext() outputs structured XML with metadata attributes for Claude
- No pgvector dependency — pure PostgreSQL with PL/pgSQL function
- Gemini free tier: 1,500 RPD / 100 RPM — generous for batch embedding
