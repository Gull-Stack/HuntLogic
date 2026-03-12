-- =============================================================================
-- HuntLogic Concierge — Initial Schema Migration
-- =============================================================================
-- Creates all 20 tables for the HuntLogic application.
-- Requires PostgreSQL 16+ with pgvector extension.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ---------------------------------------------------------------------------
-- 1. states — US state reference data with hunting agency info
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "region" text,
  "has_draw_system" boolean NOT NULL DEFAULT false,
  "has_point_system" boolean NOT NULL DEFAULT false,
  "agency_name" text,
  "agency_url" text,
  "config" jsonb NOT NULL DEFAULT '{}',
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "states" IS 'US state reference data with wildlife agency info and draw/point system flags';

CREATE INDEX IF NOT EXISTS "states_code_idx" ON "states" ("code");
CREATE INDEX IF NOT EXISTS "states_region_idx" ON "states" ("region");
CREATE INDEX IF NOT EXISTS "states_enabled_idx" ON "states" ("enabled");

-- ---------------------------------------------------------------------------
-- 2. species — Huntable species catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "species" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "common_name" text NOT NULL,
  "scientific_name" text,
  "category" text,
  "config" jsonb NOT NULL DEFAULT '{}',
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "species" IS 'Catalog of huntable species with taxonomy and categorization';

CREATE INDEX IF NOT EXISTS "species_slug_idx" ON "species" ("slug");
CREATE INDEX IF NOT EXISTS "species_category_idx" ON "species" ("category");
CREATE INDEX IF NOT EXISTS "species_enabled_idx" ON "species" ("enabled");

-- ---------------------------------------------------------------------------
-- 3. state_species — Which species are available in which states
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "state_species" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" uuid NOT NULL REFERENCES "states" ("id") ON DELETE CASCADE,
  "species_id" uuid NOT NULL REFERENCES "species" ("id") ON DELETE CASCADE,
  "hunt_types" jsonb NOT NULL DEFAULT '[]',
  "has_draw" boolean NOT NULL DEFAULT false,
  "has_otc" boolean NOT NULL DEFAULT false,
  "has_points" boolean NOT NULL DEFAULT false,
  "point_type" text,
  "max_points" integer,
  "config" jsonb NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE "state_species" IS 'Junction table mapping species availability per state with draw/point config';

CREATE UNIQUE INDEX IF NOT EXISTS "state_species_unique_idx" ON "state_species" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "state_species_state_id_idx" ON "state_species" ("state_id");
CREATE INDEX IF NOT EXISTS "state_species_species_id_idx" ON "state_species" ("species_id");

-- ---------------------------------------------------------------------------
-- 4. hunt_units — Geographic hunting units/areas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "hunt_units" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" uuid NOT NULL REFERENCES "states" ("id") ON DELETE CASCADE,
  "species_id" uuid NOT NULL REFERENCES "species" ("id") ON DELETE CASCADE,
  "unit_code" text NOT NULL,
  "unit_name" text,
  "region_name" text,
  "public_land_pct" real,
  "elevation_min" integer,
  "elevation_max" integer,
  "terrain_class" text,
  "access_notes" text,
  "config" jsonb NOT NULL DEFAULT '{}',
  "enabled" boolean NOT NULL DEFAULT true
);

COMMENT ON TABLE "hunt_units" IS 'Geographic hunting units with terrain/access metadata per state and species';

CREATE UNIQUE INDEX IF NOT EXISTS "hunt_units_unique_idx" ON "hunt_units" ("state_id", "unit_code", "species_id");
CREATE INDEX IF NOT EXISTS "hunt_units_state_id_idx" ON "hunt_units" ("state_id");
CREATE INDEX IF NOT EXISTS "hunt_units_species_id_idx" ON "hunt_units" ("species_id");
CREATE INDEX IF NOT EXISTS "hunt_units_unit_code_idx" ON "hunt_units" ("unit_code");
CREATE INDEX IF NOT EXISTS "hunt_units_enabled_idx" ON "hunt_units" ("enabled");

-- ---------------------------------------------------------------------------
-- 5. users — Application users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "phone" text,
  "display_name" text,
  "avatar_url" text,
  "onboarding_step" text NOT NULL DEFAULT 'welcome',
  "onboarding_complete" boolean NOT NULL DEFAULT false,
  "timezone" text NOT NULL DEFAULT 'America/Denver',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "users" IS 'Application users with onboarding state and profile info';

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "users_onboarding_step_idx" ON "users" ("onboarding_step");

-- ---------------------------------------------------------------------------
-- 6. hunter_preferences — Dynamic key-value preference store per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "hunter_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "confidence" real NOT NULL DEFAULT 1.0,
  "source" text NOT NULL DEFAULT 'user',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "hunter_preferences" IS 'Dynamic key-value preferences per user (species interest, travel, budget, etc.)';

CREATE UNIQUE INDEX IF NOT EXISTS "hunter_prefs_user_cat_key_idx" ON "hunter_preferences" ("user_id", "category", "key");
CREATE INDEX IF NOT EXISTS "hunter_prefs_user_id_idx" ON "hunter_preferences" ("user_id");
CREATE INDEX IF NOT EXISTS "hunter_prefs_category_idx" ON "hunter_preferences" ("category");

-- ---------------------------------------------------------------------------
-- 7. point_holdings — User preference/bonus point balances per state/species
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "point_holdings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "state_id" uuid NOT NULL REFERENCES "states" ("id"),
  "species_id" uuid NOT NULL REFERENCES "species" ("id"),
  "point_type" text NOT NULL,
  "points" integer NOT NULL DEFAULT 0,
  "year_started" integer,
  "verified" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "point_holdings" IS 'User draw point balances per state, species, and point type';

CREATE UNIQUE INDEX IF NOT EXISTS "point_holdings_unique_idx" ON "point_holdings" ("user_id", "state_id", "species_id", "point_type");
CREATE INDEX IF NOT EXISTS "point_holdings_user_id_idx" ON "point_holdings" ("user_id");
CREATE INDEX IF NOT EXISTS "point_holdings_state_species_idx" ON "point_holdings" ("state_id", "species_id");

-- ---------------------------------------------------------------------------
-- 8. application_history — User draw application history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "application_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "state_id" uuid NOT NULL REFERENCES "states" ("id"),
  "species_id" uuid NOT NULL REFERENCES "species" ("id"),
  "hunt_unit_id" uuid REFERENCES "hunt_units" ("id"),
  "year" integer NOT NULL,
  "choice_rank" integer,
  "result" text,
  "tag_type" text,
  "cost_paid" numeric(10, 2),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "application_history" IS 'Historical record of user draw applications and results';

CREATE INDEX IF NOT EXISTS "app_history_user_id_idx" ON "application_history" ("user_id");
CREATE INDEX IF NOT EXISTS "app_history_state_species_idx" ON "application_history" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "app_history_year_idx" ON "application_history" ("year");
CREATE INDEX IF NOT EXISTS "app_history_user_year_idx" ON "application_history" ("user_id", "year");

-- ---------------------------------------------------------------------------
-- 9. harvest_history — User harvest records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "harvest_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "state_id" uuid NOT NULL REFERENCES "states" ("id"),
  "species_id" uuid NOT NULL REFERENCES "species" ("id"),
  "hunt_unit_id" uuid REFERENCES "hunt_units" ("id"),
  "year" integer NOT NULL,
  "success" boolean,
  "weapon_type" text,
  "trophy_score" numeric(6, 2),
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "harvest_history" IS 'User harvest records with success, weapon type, and trophy scores';

CREATE INDEX IF NOT EXISTS "harvest_history_user_id_idx" ON "harvest_history" ("user_id");
CREATE INDEX IF NOT EXISTS "harvest_history_state_species_idx" ON "harvest_history" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "harvest_history_year_idx" ON "harvest_history" ("year");

-- ---------------------------------------------------------------------------
-- 10. data_sources — External data source registry for scraping/ingestion
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "data_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "source_type" text NOT NULL,
  "authority_tier" integer NOT NULL DEFAULT 3,
  "url" text,
  "scraper_config" jsonb NOT NULL DEFAULT '{}',
  "refresh_cadence" text NOT NULL DEFAULT 'weekly',
  "last_fetched" timestamp with time zone,
  "last_success" timestamp with time zone,
  "error_count" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "status" text NOT NULL DEFAULT 'active',
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "data_sources" IS 'Registry of external data sources (state agencies, reports, forums) for scraping';

CREATE INDEX IF NOT EXISTS "data_sources_source_type_idx" ON "data_sources" ("source_type");
CREATE INDEX IF NOT EXISTS "data_sources_status_idx" ON "data_sources" ("status");
CREATE INDEX IF NOT EXISTS "data_sources_enabled_idx" ON "data_sources" ("enabled");
CREATE INDEX IF NOT EXISTS "data_sources_authority_tier_idx" ON "data_sources" ("authority_tier");

-- ---------------------------------------------------------------------------
-- 11. documents — Ingested content for RAG with pgvector embeddings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "source_id" uuid NOT NULL REFERENCES "data_sources" ("id") ON DELETE CASCADE,
  "title" text,
  "content" text,
  "doc_type" text,
  "state_id" uuid REFERENCES "states" ("id") ON DELETE SET NULL,
  "species_id" uuid REFERENCES "species" ("id") ON DELETE SET NULL,
  "year" integer,
  "url" text,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "content_hash" text,
  "freshness_score" real NOT NULL DEFAULT 1.0,
  "embedding" vector(1536),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "documents" IS 'Ingested documents for RAG with pgvector embeddings for semantic search';

CREATE INDEX IF NOT EXISTS "documents_source_id_idx" ON "documents" ("source_id");
CREATE INDEX IF NOT EXISTS "documents_doc_type_idx" ON "documents" ("doc_type");
CREATE INDEX IF NOT EXISTS "documents_state_id_idx" ON "documents" ("state_id");
CREATE INDEX IF NOT EXISTS "documents_species_id_idx" ON "documents" ("species_id");
CREATE INDEX IF NOT EXISTS "documents_year_idx" ON "documents" ("year");
CREATE INDEX IF NOT EXISTS "documents_content_hash_idx" ON "documents" ("content_hash");
CREATE INDEX IF NOT EXISTS "documents_freshness_idx" ON "documents" ("freshness_score");

-- ---------------------------------------------------------------------------
-- 12. draw_odds — Historical draw odds per unit/species/state/year
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "draw_odds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" uuid NOT NULL REFERENCES "states" ("id") ON DELETE CASCADE,
  "species_id" uuid NOT NULL REFERENCES "species" ("id") ON DELETE CASCADE,
  "hunt_unit_id" uuid REFERENCES "hunt_units" ("id") ON DELETE SET NULL,
  "year" integer NOT NULL,
  "resident_type" text NOT NULL,
  "weapon_type" text,
  "choice_rank" integer,
  "total_applicants" integer,
  "total_tags" integer,
  "min_points_drawn" integer,
  "max_points_drawn" integer,
  "avg_points_drawn" real,
  "draw_rate" real,
  "source_id" uuid REFERENCES "data_sources" ("id") ON DELETE SET NULL,
  "raw_data" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "draw_odds" IS 'Historical draw odds data per state/species/unit/year for trend analysis';

CREATE UNIQUE INDEX IF NOT EXISTS "draw_odds_unique_idx" ON "draw_odds" ("state_id", "species_id", "hunt_unit_id", "year", "resident_type", "weapon_type", "choice_rank");
CREATE INDEX IF NOT EXISTS "draw_odds_state_species_idx" ON "draw_odds" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "draw_odds_year_idx" ON "draw_odds" ("year");
CREATE INDEX IF NOT EXISTS "draw_odds_hunt_unit_idx" ON "draw_odds" ("hunt_unit_id");
CREATE INDEX IF NOT EXISTS "draw_odds_source_idx" ON "draw_odds" ("source_id");

-- ---------------------------------------------------------------------------
-- 13. harvest_stats — Aggregated harvest statistics per unit/species/year
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "harvest_stats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" uuid NOT NULL REFERENCES "states" ("id") ON DELETE CASCADE,
  "species_id" uuid NOT NULL REFERENCES "species" ("id") ON DELETE CASCADE,
  "hunt_unit_id" uuid REFERENCES "hunt_units" ("id") ON DELETE SET NULL,
  "year" integer NOT NULL,
  "weapon_type" text,
  "total_hunters" integer,
  "total_harvest" integer,
  "success_rate" real,
  "avg_days_hunted" real,
  "trophy_metrics" jsonb,
  "source_id" uuid REFERENCES "data_sources" ("id") ON DELETE SET NULL,
  "raw_data" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "harvest_stats" IS 'Aggregated harvest statistics per state/species/unit for success rate analysis';

CREATE UNIQUE INDEX IF NOT EXISTS "harvest_stats_unique_idx" ON "harvest_stats" ("state_id", "species_id", "hunt_unit_id", "year", "weapon_type");
CREATE INDEX IF NOT EXISTS "harvest_stats_state_species_idx" ON "harvest_stats" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "harvest_stats_year_idx" ON "harvest_stats" ("year");
CREATE INDEX IF NOT EXISTS "harvest_stats_hunt_unit_idx" ON "harvest_stats" ("hunt_unit_id");

-- ---------------------------------------------------------------------------
-- 14. seasons — Hunt season dates per state/species/unit/year
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "seasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" uuid NOT NULL REFERENCES "states" ("id") ON DELETE CASCADE,
  "species_id" uuid NOT NULL REFERENCES "species" ("id") ON DELETE CASCADE,
  "hunt_unit_id" uuid REFERENCES "hunt_units" ("id") ON DELETE SET NULL,
  "year" integer NOT NULL,
  "season_name" text,
  "weapon_type" text,
  "start_date" date,
  "end_date" date,
  "tag_type" text,
  "quota" integer,
  "config" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "seasons" IS 'Hunt season dates and quotas per state/species/unit/year';

CREATE INDEX IF NOT EXISTS "seasons_state_species_idx" ON "seasons" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "seasons_year_idx" ON "seasons" ("year");
CREATE INDEX IF NOT EXISTS "seasons_hunt_unit_idx" ON "seasons" ("hunt_unit_id");
CREATE INDEX IF NOT EXISTS "seasons_start_date_idx" ON "seasons" ("start_date");

-- ---------------------------------------------------------------------------
-- 15. deadlines — Application deadlines and important dates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "deadlines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" uuid NOT NULL REFERENCES "states" ("id") ON DELETE CASCADE,
  "species_id" uuid REFERENCES "species" ("id") ON DELETE SET NULL,
  "year" integer NOT NULL,
  "deadline_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "deadline_date" date NOT NULL,
  "reminder_days_before" jsonb NOT NULL DEFAULT '[30, 14, 7, 3, 1]',
  "url" text,
  "config" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "deadlines" IS 'Application deadlines and important dates per state/species/year';

CREATE INDEX IF NOT EXISTS "deadlines_state_id_idx" ON "deadlines" ("state_id");
CREATE INDEX IF NOT EXISTS "deadlines_year_idx" ON "deadlines" ("year");
CREATE INDEX IF NOT EXISTS "deadlines_deadline_date_idx" ON "deadlines" ("deadline_date");
CREATE INDEX IF NOT EXISTS "deadlines_type_idx" ON "deadlines" ("deadline_type");
CREATE INDEX IF NOT EXISTS "deadlines_state_year_idx" ON "deadlines" ("state_id", "year");

-- ---------------------------------------------------------------------------
-- 16. playbooks — Living strategy documents per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "playbooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "version" integer NOT NULL DEFAULT 1,
  "status" text NOT NULL DEFAULT 'active',
  "goals_summary" jsonb NOT NULL DEFAULT '{}',
  "strategy_data" jsonb NOT NULL DEFAULT '{}',
  "generated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "playbooks" IS 'Living strategy playbooks per user with versioning';

CREATE INDEX IF NOT EXISTS "playbooks_user_id_idx" ON "playbooks" ("user_id");
CREATE INDEX IF NOT EXISTS "playbooks_status_idx" ON "playbooks" ("status");
CREATE INDEX IF NOT EXISTS "playbooks_user_status_idx" ON "playbooks" ("user_id", "status");

-- ---------------------------------------------------------------------------
-- 17. recommendations — Individual hunt recommendations within a playbook
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "recommendations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "playbook_id" uuid NOT NULL REFERENCES "playbooks" ("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "state_id" uuid NOT NULL REFERENCES "states" ("id"),
  "species_id" uuid NOT NULL REFERENCES "species" ("id"),
  "hunt_unit_id" uuid REFERENCES "hunt_units" ("id") ON DELETE SET NULL,
  "rec_type" text NOT NULL,
  "orientation" text,
  "rank" integer,
  "score" real,
  "confidence" real,
  "rationale" text,
  "cost_estimate" jsonb NOT NULL DEFAULT '{}',
  "timeline" text,
  "draw_odds_ctx" jsonb NOT NULL DEFAULT '{}',
  "forecast_ctx" jsonb NOT NULL DEFAULT '{}',
  "factors" jsonb NOT NULL DEFAULT '{}',
  "status" text NOT NULL DEFAULT 'active',
  "user_feedback" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "recommendations" IS 'Individual AI-generated hunt recommendations with scoring, rationale, and user feedback';

CREATE INDEX IF NOT EXISTS "recommendations_playbook_id_idx" ON "recommendations" ("playbook_id");
CREATE INDEX IF NOT EXISTS "recommendations_user_id_idx" ON "recommendations" ("user_id");
CREATE INDEX IF NOT EXISTS "recommendations_state_species_idx" ON "recommendations" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "recommendations_status_idx" ON "recommendations" ("status");
CREATE INDEX IF NOT EXISTS "recommendations_rec_type_idx" ON "recommendations" ("rec_type");
CREATE INDEX IF NOT EXISTS "recommendations_user_status_idx" ON "recommendations" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "recommendations_rank_idx" ON "recommendations" ("rank");

-- ---------------------------------------------------------------------------
-- 18. user_actions — Deadline reminders, tasks, and to-dos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
  "deadline_id" uuid REFERENCES "deadlines" ("id") ON DELETE SET NULL,
  "action_type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "due_date" date,
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'pending',
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "user_actions" IS 'User action items, deadline reminders, and tasks';

CREATE INDEX IF NOT EXISTS "user_actions_user_id_idx" ON "user_actions" ("user_id");
CREATE INDEX IF NOT EXISTS "user_actions_deadline_id_idx" ON "user_actions" ("deadline_id");
CREATE INDEX IF NOT EXISTS "user_actions_status_idx" ON "user_actions" ("status");
CREATE INDEX IF NOT EXISTS "user_actions_priority_idx" ON "user_actions" ("priority");
CREATE INDEX IF NOT EXISTS "user_actions_due_date_idx" ON "user_actions" ("due_date");
CREATE INDEX IF NOT EXISTS "user_actions_user_status_idx" ON "user_actions" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "user_actions_action_type_idx" ON "user_actions" ("action_type");

-- ---------------------------------------------------------------------------
-- 19. ai_prompts — Versioned, admin-managed prompt templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ai_prompts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "category" text,
  "template" text NOT NULL,
  "variables" jsonb NOT NULL DEFAULT '[]',
  "model" text NOT NULL DEFAULT 'claude-sonnet-4-6',
  "max_tokens" integer NOT NULL DEFAULT 4096,
  "temperature" real NOT NULL DEFAULT 0.7,
  "version" integer NOT NULL DEFAULT 1,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "ai_prompts" IS 'Versioned AI prompt templates for onboarding, recommendations, and chat';

CREATE INDEX IF NOT EXISTS "ai_prompts_slug_idx" ON "ai_prompts" ("slug");
CREATE INDEX IF NOT EXISTS "ai_prompts_category_idx" ON "ai_prompts" ("category");
CREATE INDEX IF NOT EXISTS "ai_prompts_active_idx" ON "ai_prompts" ("active");

-- ---------------------------------------------------------------------------
-- 20. app_config — Dynamic key-value configuration store
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "app_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "namespace" text NOT NULL,
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "description" text,
  "updated_by" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE "app_config" IS 'Dynamic application configuration store with namespaced key-value pairs';

CREATE UNIQUE INDEX IF NOT EXISTS "app_config_namespace_key_idx" ON "app_config" ("namespace", "key");
CREATE INDEX IF NOT EXISTS "app_config_namespace_idx" ON "app_config" ("namespace");
