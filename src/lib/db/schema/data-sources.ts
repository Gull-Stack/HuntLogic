import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { states, species } from "./hunting";

// ========================
// Custom pgvector type for embedding column
// NOTE: Requires pgvector extension enabled in PostgreSQL.
// Run: CREATE EXTENSION IF NOT EXISTS vector;
// If Drizzle doesn't natively support vector in your version,
// add a raw SQL migration: ALTER TABLE documents ADD COLUMN embedding vector(1536);
// ========================

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  fromDriver(value: string): number[] {
    // pgvector returns '[1,2,3]' format
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseFloat(v));
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});

// ========================
// DATA SOURCES (where hunting data comes from)
// ========================

export const dataSources = pgTable(
  "data_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull(), // 'state_agency' | 'harvest_report' | 'draw_report' | 'forum' | 'expert' | 'industry'
    authorityTier: integer("authority_tier").notNull().default(3), // 1=official, 2=verified, 3=expert, 4=community
    url: text("url"),
    scraperConfig: jsonb("scraper_config").notNull().default({}), // how to scrape/fetch
    refreshCadence: text("refresh_cadence").notNull().default("weekly"), // 'daily' | 'weekly' | 'monthly' | 'annual' | 'manual'
    lastFetched: timestamp("last_fetched", { withTimezone: true }),
    lastSuccess: timestamp("last_success", { withTimezone: true }),
    errorCount: integer("error_count").notNull().default(0),
    lastError: text("last_error"),
    status: text("status").notNull().default("active"), // 'active' | 'paused' | 'error'
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("data_sources_source_type_idx").on(table.sourceType),
    index("data_sources_status_idx").on(table.status),
    index("data_sources_enabled_idx").on(table.enabled),
    index("data_sources_authority_tier_idx").on(table.authorityTier),
  ]
);

// ========================
// DOCUMENTS (ingested content for RAG)
// ========================

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => dataSources.id, { onDelete: "cascade" }),
    title: text("title"),
    content: text("content"),
    docType: text("doc_type"), // 'regulation' | 'harvest_report' | 'draw_report' | 'season_summary' | 'commission_minutes' | 'forum_post' | 'article'
    stateId: uuid("state_id").references(() => states.id, {
      onDelete: "set null",
    }),
    speciesId: uuid("species_id").references(() => species.id, {
      onDelete: "set null",
    }),
    year: integer("year"),
    url: text("url"),
    metadata: jsonb("metadata").notNull().default({}),
    contentHash: text("content_hash"), // SHA-256 for dedup
    freshnessScore: real("freshness_score").notNull().default(1.0),
    // pgvector embedding for semantic search / RAG
    // NOTE: Requires CREATE EXTENSION IF NOT EXISTS vector;
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("documents_source_id_idx").on(table.sourceId),
    index("documents_doc_type_idx").on(table.docType),
    index("documents_state_id_idx").on(table.stateId),
    index("documents_species_id_idx").on(table.speciesId),
    index("documents_year_idx").on(table.year),
    index("documents_content_hash_idx").on(table.contentHash),
    index("documents_freshness_idx").on(table.freshnessScore),
  ]
);

// ========================
// RELATIONS
// ========================

export const dataSourcesRelations = relations(
  dataSources,
  ({ many }) => ({
    documents: many(documents),
  })
);

export const documentsRelations = relations(documents, ({ one }) => ({
  source: one(dataSources, {
    fields: [documents.sourceId],
    references: [dataSources.id],
  }),
  state: one(states, {
    fields: [documents.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [documents.speciesId],
    references: [species.id],
  }),
}));
