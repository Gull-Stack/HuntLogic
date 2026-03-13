-- Migration 0004: Add hunt groups tables
-- Feature 7: Collaborative Family/Friend Planning

CREATE TABLE IF NOT EXISTS hunt_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  target_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hunt_groups_owner_id_idx ON hunt_groups(owner_id);

CREATE TABLE IF NOT EXISTS hunt_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES hunt_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'invited',
  joined_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS hunt_group_members_group_id_idx ON hunt_group_members(group_id);
CREATE INDEX IF NOT EXISTS hunt_group_members_user_id_idx ON hunt_group_members(user_id);
CREATE INDEX IF NOT EXISTS hunt_group_members_email_idx ON hunt_group_members(email);

CREATE TABLE IF NOT EXISTS hunt_group_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES hunt_groups(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  species_slug TEXT NOT NULL,
  unit_code TEXT,
  year INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'proposed',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hunt_group_plans_group_id_idx ON hunt_group_plans(group_id);
