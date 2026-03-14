import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  decimal,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { states, species, huntUnits } from "./hunting";

// ========================
// USERS
// ========================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    onboardingStep: text("onboarding_step").notNull().default("welcome"),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    stripeCustomerId: text("stripe_customer_id").unique(),
    tier: text("tier").notNull().default("scout"), // 'scout' | 'pro' | 'elite'
    timezone: text("timezone").notNull().default("America/Denver"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_onboarding_step_idx").on(table.onboardingStep),
  ]
);

// ========================
// HUNTER PREFERENCES (dynamic key-value, no hardcoded columns)
// ========================

export const hunterPreferences = pgTable(
  "hunter_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(), // 'species_interest', 'travel', 'budget', 'weapon', 'orientation'
    key: text("key").notNull(), // 'elk', 'max_drive_hours', 'annual_budget'
    value: jsonb("value").notNull(), // flexible value storage
    confidence: real("confidence").notNull().default(1.0), // system confidence (inferred vs stated)
    source: text("source").notNull().default("user"), // 'user' | 'inferred' | 'behavioral'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("hunter_prefs_user_cat_key_idx").on(
      table.userId,
      table.category,
      table.key
    ),
    index("hunter_prefs_user_id_idx").on(table.userId),
    index("hunter_prefs_category_idx").on(table.category),
  ]
);

// ========================
// POINT HOLDINGS (per state/species)
// ========================

export const pointHoldings = pgTable(
  "point_holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id),
    speciesId: uuid("species_id")
      .notNull()
      .references(() => species.id),
    pointType: text("point_type").notNull(), // 'preference' | 'bonus' | 'loyalty'
    points: integer("points").notNull().default(0),
    yearStarted: integer("year_started"),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("point_holdings_unique_idx").on(
      table.userId,
      table.stateId,
      table.speciesId,
      table.pointType
    ),
    index("point_holdings_user_id_idx").on(table.userId),
    index("point_holdings_state_species_idx").on(table.stateId, table.speciesId),
  ]
);

// ========================
// APPLICATION HISTORY
// ========================

export const applicationHistory = pgTable(
  "application_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id),
    speciesId: uuid("species_id")
      .notNull()
      .references(() => species.id),
    huntUnitId: uuid("hunt_unit_id").references(() => huntUnits.id),
    year: integer("year").notNull(),
    choiceRank: integer("choice_rank"), // 1st choice, 2nd, etc.
    result: text("result"), // 'drawn' | 'unsuccessful' | 'bonus_drawn' | 'waitlisted'
    tagType: text("tag_type"), // 'resident' | 'nonresident'
    costPaid: decimal("cost_paid", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("app_history_user_id_idx").on(table.userId),
    index("app_history_state_species_idx").on(table.stateId, table.speciesId),
    index("app_history_year_idx").on(table.year),
    index("app_history_user_year_idx").on(table.userId, table.year),
  ]
);

// ========================
// HARVEST HISTORY
// ========================

export const harvestHistory = pgTable(
  "harvest_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id),
    speciesId: uuid("species_id")
      .notNull()
      .references(() => species.id),
    huntUnitId: uuid("hunt_unit_id").references(() => huntUnits.id),
    year: integer("year").notNull(),
    success: boolean("success"),
    weaponType: text("weapon_type"),
    trophyScore: decimal("trophy_score", { precision: 6, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("harvest_history_user_id_idx").on(table.userId),
    index("harvest_history_state_species_idx").on(
      table.stateId,
      table.speciesId
    ),
    index("harvest_history_year_idx").on(table.year),
  ]
);

// ========================
// RELATIONS
// ========================

export const usersRelations = relations(users, ({ many }) => ({
  preferences: many(hunterPreferences),
  pointHoldings: many(pointHoldings),
  applicationHistory: many(applicationHistory),
  harvestHistory: many(harvestHistory),
}));

export const hunterPreferencesRelations = relations(
  hunterPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [hunterPreferences.userId],
      references: [users.id],
    }),
  })
);

export const pointHoldingsRelations = relations(pointHoldings, ({ one }) => ({
  user: one(users, {
    fields: [pointHoldings.userId],
    references: [users.id],
  }),
  state: one(states, {
    fields: [pointHoldings.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [pointHoldings.speciesId],
    references: [species.id],
  }),
}));

export const applicationHistoryRelations = relations(
  applicationHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [applicationHistory.userId],
      references: [users.id],
    }),
    state: one(states, {
      fields: [applicationHistory.stateId],
      references: [states.id],
    }),
    species: one(species, {
      fields: [applicationHistory.speciesId],
      references: [species.id],
    }),
    huntUnit: one(huntUnits, {
      fields: [applicationHistory.huntUnitId],
      references: [huntUnits.id],
    }),
  })
);

export const harvestHistoryRelations = relations(
  harvestHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [harvestHistory.userId],
      references: [users.id],
    }),
    state: one(states, {
      fields: [harvestHistory.stateId],
      references: [states.id],
    }),
    species: one(species, {
      fields: [harvestHistory.speciesId],
      references: [species.id],
    }),
    huntUnit: one(huntUnits, {
      fields: [harvestHistory.huntUnitId],
      references: [huntUnits.id],
    }),
  })
);
