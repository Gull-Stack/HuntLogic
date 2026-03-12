import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  vector,
} from "drizzle-orm/pg-core";
import { states } from "./hunting";

// Enums
export const dataSourceTypeEnum = pgEnum("data_source_type", [
  "state_agency",
  "federal_agency",
  "research",
  "user_contributed",
  "web_scrape",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "indexed",
  "failed",
  "archived",
]);

// Data Sources — where hunting data comes from
export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: dataSourceTypeEnum("type").notNull(),
  stateId: uuid("state_id").references(() => states.id, {
    onDelete: "set null",
  }),
  baseUrl: text("base_url"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
  scrapeFrequency: varchar("scrape_frequency", { length: 50 }), // daily, weekly, monthly, annual
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Documents — individual pieces of ingested content (for RAG)
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  dataSourceId: uuid("data_source_id")
    .notNull()
    .references(() => dataSources.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(), // SHA-256
  url: text("url"),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"),
  status: documentStatusEnum("status").default("pending").notNull(),
  // pgvector embedding for semantic search / RAG
  embedding: vector("embedding", { dimensions: 1536 }),
  chunkIndex: integer("chunk_index").default(0),
  parentDocumentId: uuid("parent_document_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  indexedAt: timestamp("indexed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const dataSourcesRelations = relations(dataSources, ({ one, many }) => ({
  state: one(states, {
    fields: [dataSources.stateId],
    references: [states.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [documents.dataSourceId],
    references: [dataSources.id],
  }),
  parentDocument: one(documents, {
    fields: [documents.parentDocumentId],
    references: [documents.id],
  }),
}));
