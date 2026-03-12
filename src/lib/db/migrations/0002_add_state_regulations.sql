-- =============================================================================
-- Migration 0002: State Regulations
-- =============================================================================
-- Adds a table for tracking official state hunting regulation documents
-- (PDFs, HTML pages, interactive tools) with URLs for each state.
-- =============================================================================

CREATE TABLE IF NOT EXISTS state_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  format TEXT,
  year INTEGER,
  description TEXT,
  last_verified TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS state_regulations_state_id_idx ON state_regulations(state_id);
CREATE INDEX IF NOT EXISTS state_regulations_doc_type_idx ON state_regulations(doc_type);
CREATE INDEX IF NOT EXISTS state_regulations_year_idx ON state_regulations(year);
CREATE INDEX IF NOT EXISTS state_regulations_enabled_idx ON state_regulations(enabled);

-- Unique constraint: one document per (state, docType, year)
CREATE UNIQUE INDEX IF NOT EXISTS state_regulations_unique_idx
  ON state_regulations(state_id, doc_type, year);
