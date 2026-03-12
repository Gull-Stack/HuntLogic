import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const promptCategoryEnum = pgEnum("prompt_category", [
  "concierge",
  "recommendation",
  "playbook",
  "analysis",
  "summarization",
  "system",
]);

// AI Prompts — versioned prompt templates
export const aiPrompts = pgTable(
  "ai_prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull(),
    category: promptCategoryEnum("category").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt"),
    userPromptTemplate: text("user_prompt_template").notNull(),
    model: varchar("model", { length: 100 }),
    maxTokens: jsonb("max_tokens").$type<number>(),
    temperature: jsonb("temperature").$type<number>(),
    isActive: boolean("is_active").default(true).notNull(),
    version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ai_prompts_slug_version_idx").on(table.slug, table.version),
  ]
);

// App Config — key-value configuration store
export const appConfig = pgTable(
  "app_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 255 }).notNull(),
    value: jsonb("value").notNull(),
    description: text("description"),
    isSecret: boolean("is_secret").default(false).notNull(),
    category: varchar("category", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("app_config_key_idx").on(table.key)]
);
