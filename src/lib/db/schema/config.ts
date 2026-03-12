import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ========================
// AI PROMPTS (versioned, admin-managed prompt templates)
// ========================

export const aiPrompts = pgTable(
  "ai_prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(), // 'onboarding_welcome', 'strategy_summary', etc.
    name: text("name").notNull(),
    category: text("category"), // 'onboarding' | 'recommendation' | 'playbook' | 'chat' | 'notification' | 'explanation'
    template: text("template").notNull(),
    variables: jsonb("variables").notNull().default([]), // expected template variables
    model: text("model").notNull().default("claude-sonnet-4-6"),
    maxTokens: integer("max_tokens").notNull().default(4096),
    temperature: real("temperature").notNull().default(0.7),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_prompts_slug_idx").on(table.slug),
    index("ai_prompts_category_idx").on(table.category),
    index("ai_prompts_active_idx").on(table.active),
  ]
);

// ========================
// APP CONFIG (dynamic key-value configuration store)
// ========================

export const appConfig = pgTable(
  "app_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    namespace: text("namespace").notNull(), // 'onboarding', 'recommendations', 'notifications', 'scraping'
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("app_config_namespace_key_idx").on(
      table.namespace,
      table.key
    ),
    index("app_config_namespace_idx").on(table.namespace),
  ]
);
