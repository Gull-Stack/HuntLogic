# Step 15: RAG Context Wired Into Claude Explanation Pipeline

**Status**: Complete
**Commit**: `ae657e6` — "Wire RAG context into Claude explanation pipeline"

## What Changed

### `src/services/intelligence/explanation-generator.ts`

Three Claude prompt chains now pull live state agency data before generating explanations:

### 1. Individual Recommendation Explanations (`generateExplanation`)
- Before calling Claude, queries RAG with `"{stateCode} {speciesName} draw odds regulations {unitCode}"`
- Filters by `stateId` and `speciesId` for targeted retrieval
- Pulls up to 3 most relevant documents
- Injected as `RELEVANT STATE AGENCY DATA:` block in the prompt
- Claude now references real deadlines, regulation details, and draw statistics

### 2. Playbook Executive Summary (`generatePlaybookSummary`)
- Collects all unique state names from near/mid/long-term recommendations
- Queries RAG with `"hunting regulations draw odds seasons {stateNames}"`
- Pulls up to 5 documents covering all recommended states
- Injected as `STATE AGENCY REFERENCE DATA:` block
- Summaries now weave in real deadline dates and regulation context

### 3. Strategy Rationale (`generateStrategyRationale`)
- Pulls state codes from point strategy holdings
- Queries RAG with `"hunting application strategy point system draw odds {states}"`
- Pulls up to 3 documents on point systems and application procedures
- Injected as `STATE AGENCY CONTEXT:` block

## Architecture

```
User requests playbook
  ↓
Candidate Generation → Scoring → Strategy Optimization
  ↓
For each recommendation:
  ├── RAG: searchDocuments(state + species + unit)
  │     └── Gemini embedding → cosine_similarity → top 3 docs
  └── Claude: generateExplanation(hunt + profile + RAG context)
        └── "Why this hunt fits you" with real agency data
  ↓
Playbook Summary:
  ├── RAG: assembleContext(all states in strategy)
  └── Claude: executive summary grounded in regulations
  ↓
Strategy Rationale:
  ├── RAG: assembleContext(point strategy states)
  └── Claude: strategic explanation with application details
```

## Graceful Degradation
- If RAG fails (no GEMINI_API_KEY, no embeddings, DB error), explanations still generate
- `try/catch` around every `assembleContext()` call
- Logs warning but doesn't block the pipeline
- Falls back to data-only Claude explanations (same as before)

## System Prompt Update
Added rule: "If state agency data is provided, reference specific details (deadlines, regulation changes, draw statistics) to make your explanation more authoritative"

## Example Flow
Query: "WY elk draw odds regulations Unit 100"
→ RAG returns: WY Application Dates & Deadlines (0.72), WY Regulations (0.69)
→ Claude explanation: "With Wyoming's nonresident elk application deadline coming up on January 31, your 4 preference points put you in solid position for Unit 100. The 23% draw rate and 68% success rate make this a strong near-term opportunity that fits your $3,500 budget..."

## Quality Notes
- No new dependencies — uses existing `assembleContext()` from rag.ts
- Zero impact on pipeline speed when no documents exist (RAG returns empty)
- Embedding cost: ~3 Gemini API calls per recommendation (free tier handles it)
- Claude sees real agency text, not hallucinated data
