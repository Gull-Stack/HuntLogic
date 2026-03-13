-- Migration 0005: Add outfitters tables
-- Feature 8: Outfitter Matching & Directory

CREATE TABLE IF NOT EXISTS outfitters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  email TEXT,
  state_code TEXT NOT NULL,
  species_slugs JSONB NOT NULL DEFAULT '[]',
  unit_codes JSONB NOT NULL DEFAULT '[]',
  hunt_types JSONB NOT NULL DEFAULT '[]',
  price_range TEXT,
  rating REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outfitters_state_code_idx ON outfitters(state_code);
CREATE INDEX IF NOT EXISTS outfitters_rating_idx ON outfitters(rating);
CREATE INDEX IF NOT EXISTS outfitters_enabled_idx ON outfitters(enabled);

CREATE TABLE IF NOT EXISTS outfitter_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfitter_id UUID NOT NULL REFERENCES outfitters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  review TEXT,
  hunt_success BOOLEAN,
  verified_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outfitter_reviews_outfitter_id_idx ON outfitter_reviews(outfitter_id);
CREATE INDEX IF NOT EXISTS outfitter_reviews_user_id_idx ON outfitter_reviews(user_id);
