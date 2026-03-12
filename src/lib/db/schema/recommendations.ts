import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { states, species, huntUnits } from "./hunting";

// ========================
// PLAYBOOKS (living strategy documents)
// ========================

export const playbooks = pgTable(
  "playbooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("active"), // 'active' | 'archived'
    goalsSummary: jsonb("goals_summary").notNull().default({}),
    strategyData: jsonb("strategy_data").notNull().default({}),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("playbooks_user_id_idx").on(table.userId),
    index("playbooks_status_idx").on(table.status),
    index("playbooks_user_status_idx").on(table.userId, table.status),
  ]
);

// ========================
// RECOMMENDATIONS (individual hunt recommendations within a playbook)
// ========================

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playbookId: uuid("playbook_id")
      .notNull()
      .references(() => playbooks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id),
    speciesId: uuid("species_id")
      .notNull()
      .references(() => species.id),
    huntUnitId: uuid("hunt_unit_id").references(() => huntUnits.id, {
      onDelete: "set null",
    }),
    recType: text("rec_type").notNull(), // 'apply_now' | 'build_points' | 'otc_opportunity' | 'watch'
    orientation: text("orientation"), // 'trophy' | 'opportunity' | 'balanced'
    rank: integer("rank"),
    score: real("score"), // composite score
    confidence: real("confidence"), // 0-1 confidence level
    rationale: text("rationale"), // AI-generated explanation
    costEstimate: jsonb("cost_estimate").notNull().default({}), // { tag, license, travel, total }
    timeline: text("timeline"), // 'this_year' | '1-3_years' | '3-5_years' | '5+_years'
    drawOddsCtx: jsonb("draw_odds_ctx").notNull().default({}), // current odds context
    forecastCtx: jsonb("forecast_ctx").notNull().default({}), // forward-looking forecast data
    factors: jsonb("factors").notNull().default({}), // scoring breakdown by factor
    status: text("status").notNull().default("active"), // 'active' | 'saved' | 'dismissed' | 'applied'
    userFeedback: text("user_feedback"), // 'like' | 'dislike' | 'save'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("recommendations_playbook_id_idx").on(table.playbookId),
    index("recommendations_user_id_idx").on(table.userId),
    index("recommendations_state_species_idx").on(
      table.stateId,
      table.speciesId
    ),
    index("recommendations_status_idx").on(table.status),
    index("recommendations_rec_type_idx").on(table.recType),
    index("recommendations_user_status_idx").on(table.userId, table.status),
    index("recommendations_rank_idx").on(table.rank),
  ]
);

// ========================
// RELATIONS
// ========================

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
    playbook: one(playbooks, {
      fields: [recommendations.playbookId],
      references: [playbooks.id],
    }),
    user: one(users, {
      fields: [recommendations.userId],
      references: [users.id],
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
