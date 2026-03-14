-- Migration: 0007_add_concierge
-- Description: Add Application Concierge system tables + user stripe/tier columns
-- Tables: state_fee_schedules, service_fee_config, application_orders,
--         application_order_items, payments, refunds, state_form_configs,
--         fulfillment_logs, ops_users

-- ===========================================================================
-- 1. Add new columns to users
-- ===========================================================================

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "tier" TEXT NOT NULL DEFAULT 'scout';

-- ===========================================================================
-- 2. State Fee Schedules
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "state_fee_schedules" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" UUID NOT NULL REFERENCES "states"("id"),
  "species_id" UUID NOT NULL REFERENCES "species"("id"),
  "year" INTEGER NOT NULL,
  "residency" TEXT NOT NULL,
  "fee_type" TEXT NOT NULL,
  "fee_name" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT TRUE,
  "notes" TEXT,
  "source_url" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "state_fee_schedules_unique_idx"
  ON "state_fee_schedules" ("state_id", "species_id", "year", "residency", "fee_type");
CREATE INDEX IF NOT EXISTS "state_fee_schedules_state_id_idx"
  ON "state_fee_schedules" ("state_id");
CREATE INDEX IF NOT EXISTS "state_fee_schedules_species_id_idx"
  ON "state_fee_schedules" ("species_id");
CREATE INDEX IF NOT EXISTS "state_fee_schedules_year_idx"
  ON "state_fee_schedules" ("year");
CREATE INDEX IF NOT EXISTS "state_fee_schedules_state_year_idx"
  ON "state_fee_schedules" ("state_id", "year");

-- ===========================================================================
-- 3. Service Fee Config
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "service_fee_config" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tier" TEXT NOT NULL,
  "fee_type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "is_percentage" BOOLEAN NOT NULL DEFAULT FALSE,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "effective_from" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "effective_until" TIMESTAMPTZ,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_fee_config_unique_idx"
  ON "service_fee_config" ("tier", "fee_type");
CREATE INDEX IF NOT EXISTS "service_fee_config_tier_idx"
  ON "service_fee_config" ("tier");
CREATE INDEX IF NOT EXISTS "service_fee_config_active_idx"
  ON "service_fee_config" ("active");

-- ===========================================================================
-- 4. Application Orders
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "application_orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "group_id" UUID REFERENCES "hunt_groups"("id") ON DELETE SET NULL,
  "year" INTEGER NOT NULL,
  "tier" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "state_fee_total" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "service_fee_total" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "grand_total" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "stripe_payment_intent_id" TEXT,
  "notes" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "application_orders_user_id_idx"
  ON "application_orders" ("user_id");
CREATE INDEX IF NOT EXISTS "application_orders_group_id_idx"
  ON "application_orders" ("group_id");
CREATE INDEX IF NOT EXISTS "application_orders_status_idx"
  ON "application_orders" ("status");
CREATE INDEX IF NOT EXISTS "application_orders_year_idx"
  ON "application_orders" ("year");
CREATE INDEX IF NOT EXISTS "application_orders_user_year_idx"
  ON "application_orders" ("user_id", "year");
CREATE INDEX IF NOT EXISTS "application_orders_stripe_pi_idx"
  ON "application_orders" ("stripe_payment_intent_id");

-- ===========================================================================
-- 5. Application Order Items
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "application_order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "application_orders"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "state_id" UUID NOT NULL REFERENCES "states"("id"),
  "species_id" UUID NOT NULL REFERENCES "species"("id"),
  "hunt_unit_id" UUID REFERENCES "hunt_units"("id") ON DELETE SET NULL,
  "recommendation_id" UUID REFERENCES "recommendations"("id") ON DELETE SET NULL,
  "credential_id" UUID REFERENCES "state_credentials"("id") ON DELETE SET NULL,
  "residency" TEXT NOT NULL,
  "hunt_type" TEXT,
  "choice_rank" INTEGER NOT NULL DEFAULT 1,
  "state_fee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "service_fee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "confirmation_number" TEXT,
  "form_data" JSONB NOT NULL DEFAULT '{}',
  "submitted_at" TIMESTAMPTZ,
  "confirmed_at" TIMESTAMPTZ,
  "error_message" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "app_order_items_order_id_idx"
  ON "application_order_items" ("order_id");
CREATE INDEX IF NOT EXISTS "app_order_items_user_id_idx"
  ON "application_order_items" ("user_id");
CREATE INDEX IF NOT EXISTS "app_order_items_state_species_idx"
  ON "application_order_items" ("state_id", "species_id");
CREATE INDEX IF NOT EXISTS "app_order_items_status_idx"
  ON "application_order_items" ("status");
CREATE INDEX IF NOT EXISTS "app_order_items_recommendation_id_idx"
  ON "application_order_items" ("recommendation_id");
CREATE INDEX IF NOT EXISTS "app_order_items_credential_id_idx"
  ON "application_order_items" ("credential_id");

-- ===========================================================================
-- 6. Payments
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "payments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "application_orders"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_payment_intent_id" TEXT NOT NULL UNIQUE,
  "stripe_charge_id" TEXT,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_method" TEXT,
  "last4" TEXT,
  "receipt_url" TEXT,
  "failure_code" TEXT,
  "failure_message" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "paid_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "payments_order_id_idx"
  ON "payments" ("order_id");
CREATE INDEX IF NOT EXISTS "payments_user_id_idx"
  ON "payments" ("user_id");
CREATE INDEX IF NOT EXISTS "payments_stripe_pi_idx"
  ON "payments" ("stripe_payment_intent_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx"
  ON "payments" ("status");
CREATE INDEX IF NOT EXISTS "payments_user_status_idx"
  ON "payments" ("user_id", "status");

-- ===========================================================================
-- 7. Refunds
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "refunds" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_id" UUID NOT NULL REFERENCES "payments"("id") ON DELETE CASCADE,
  "order_id" UUID NOT NULL REFERENCES "application_orders"("id") ON DELETE CASCADE,
  "order_item_id" UUID REFERENCES "application_order_items"("id") ON DELETE SET NULL,
  "stripe_refund_id" TEXT UNIQUE,
  "amount" DECIMAL(10, 2) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "notes" TEXT,
  "initiated_by" TEXT,
  "processed_at" TIMESTAMPTZ,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "refunds_payment_id_idx"
  ON "refunds" ("payment_id");
CREATE INDEX IF NOT EXISTS "refunds_order_id_idx"
  ON "refunds" ("order_id");
CREATE INDEX IF NOT EXISTS "refunds_order_item_id_idx"
  ON "refunds" ("order_item_id");
CREATE INDEX IF NOT EXISTS "refunds_status_idx"
  ON "refunds" ("status");
CREATE INDEX IF NOT EXISTS "refunds_stripe_refund_id_idx"
  ON "refunds" ("stripe_refund_id");

-- ===========================================================================
-- 8. State Form Configs
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "state_form_configs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "state_id" UUID NOT NULL REFERENCES "states"("id"),
  "species_id" UUID REFERENCES "species"("id"),
  "form_type" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "schema" JSONB NOT NULL,
  "field_mapping" JSONB NOT NULL DEFAULT '{}',
  "validation_rules" JSONB NOT NULL DEFAULT '{}',
  "submission_url" TEXT,
  "instructions" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "state_form_configs_unique_idx"
  ON "state_form_configs" ("state_id", "species_id", "form_type", "year");
CREATE INDEX IF NOT EXISTS "state_form_configs_state_id_idx"
  ON "state_form_configs" ("state_id");
CREATE INDEX IF NOT EXISTS "state_form_configs_form_type_idx"
  ON "state_form_configs" ("form_type");
CREATE INDEX IF NOT EXISTS "state_form_configs_year_idx"
  ON "state_form_configs" ("year");
CREATE INDEX IF NOT EXISTS "state_form_configs_active_idx"
  ON "state_form_configs" ("active");

-- ===========================================================================
-- 9. Ops Users (must come before fulfillment_logs due to FK)
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "ops_users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "display_name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'agent',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "assigned_states" JSONB NOT NULL DEFAULT '[]',
  "max_concurrent" INTEGER NOT NULL DEFAULT 10,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ops_users_email_idx"
  ON "ops_users" ("email");
CREATE INDEX IF NOT EXISTS "ops_users_role_idx"
  ON "ops_users" ("role");
CREATE INDEX IF NOT EXISTS "ops_users_active_idx"
  ON "ops_users" ("active");

-- ===========================================================================
-- 10. Fulfillment Logs
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "fulfillment_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "application_orders"("id") ON DELETE CASCADE,
  "order_item_id" UUID REFERENCES "application_order_items"("id") ON DELETE SET NULL,
  "ops_user_id" UUID REFERENCES "ops_users"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "from_status" TEXT,
  "to_status" TEXT,
  "details" TEXT,
  "screenshot_url" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "fulfillment_logs_order_id_idx"
  ON "fulfillment_logs" ("order_id");
CREATE INDEX IF NOT EXISTS "fulfillment_logs_order_item_id_idx"
  ON "fulfillment_logs" ("order_item_id");
CREATE INDEX IF NOT EXISTS "fulfillment_logs_ops_user_id_idx"
  ON "fulfillment_logs" ("ops_user_id");
CREATE INDEX IF NOT EXISTS "fulfillment_logs_action_idx"
  ON "fulfillment_logs" ("action");
CREATE INDEX IF NOT EXISTS "fulfillment_logs_created_at_idx"
  ON "fulfillment_logs" ("created_at");
