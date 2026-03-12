import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  doublePrecision,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { states, species, huntUnits } from "./hunting";

// Enums
export const playbookStatusEnum = pgEnum("playbook_status", [
  "draft",
  "active",
  "archived",
]);

export const confidenceLevelEnum = pgEnum("confidence_level", [
  "low",
  "medium",
  "high",
  "very_high",
]);

export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "pending",
  "accepted",
  "dismissed",
  "completed",
]);

// Playbooks — multi-year hunting strategies
export const playbooks = pgTable("playbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: playbookStatusEnum("status").default("draft").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  strategy: jsonb("strategy").$type<{
    years: Array<{
      year: number;
      applications: Array<{
        stateCode: string;
        species: string;
        unit: string;
        weaponType: string;
        priority: number;
        rationale: string;
      }>;
    }>;
  }>(),
  aiGeneratedAt: timestamp("ai_generated_at", { withTimezone: true }),
  aiModelUsed: varchar("ai_model_used", { length: 100 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Recommendations — individual hunt recommendations
export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  playbookId: uuid("playbook_id").references(() => playbooks.id, {
    onDelete: "set null",
  }),
  stateId: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "cascade" }),
  speciesId: uuid("species_id")
    .notNull()
    .references(() => species.id, { onDelete: "cascade" }),
  huntUnitId: uuid("hunt_unit_id").references(() => huntUnits.id, {
    onDelete: "set null",
  }),
  year: integer("year").notNull(),
  weaponType: varchar("weapon_type", { length: 50 }),
  choiceNumber: integer("choice_number").default(1),
  status: recommendationStatusEnum("status").default("pending").notNull(),
  confidence: confidenceLevelEnum("confidence").default("medium").notNull(),
  estimatedDrawOdds: doublePrecision("estimated_draw_odds"),
  rationale: text("rationale"),
  aiAnalysis: jsonb("ai_analysis").$type<{
    pros: string[];
    cons: string[];
    alternativeUnits: string[];
    pointProjection: string;
  }>(),
  isPriority: boolean("is_priority").default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const playbooksRelations = relations(playbooks, ({ one, many }) => ({
  user: one(users, {
    fields: [playbooks.userId],
    references: [users.id],
  }),
  recommendations: many(recommendations),
}));

export const recommendationsRelations = relations(
  recommendations,
  ({ one }) => ({
    user: one(users, {
      fields: [recommendations.userId],
      references: [users.id],
    }),
    playbook: one(playbooks, {
      fields: [recommendations.playbookId],
      references: [playbooks.id],
    }),
    state: one(states, {
      fields: [recommendations.stateId],
      references: [states.id],
    }),
    species: one(species, {
      fields: [recommendations.speciesId],
      references: [species.id],
    }),
    huntUnit: one(huntUnits, {
      fields: [recommendations.huntUnitId],
      references: [huntUnits.id],
    }),
  })
);
