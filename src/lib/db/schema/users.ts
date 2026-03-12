import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "scout",
  "hunter",
  "outfitter",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  experienceLevel: experienceLevelEnum("experience_level"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Hunter Preferences
export const hunterPreferences = pgTable("hunter_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  targetSpecies: jsonb("target_species").$type<string[]>().default([]),
  targetStates: jsonb("target_states").$type<string[]>().default([]),
  weaponTypes: jsonb("weapon_types").$type<string[]>().default([]),
  huntStyles: jsonb("hunt_styles").$type<string[]>().default([]),
  physicalFitness: varchar("physical_fitness", { length: 50 }),
  maxTravelDistance: integer("max_travel_distance"),
  budgetRange: jsonb("budget_range").$type<{
    min: number;
    max: number;
  }>(),
  willingnessToWait: integer("willingness_to_wait"), // years
  preferPublicLand: boolean("prefer_public_land").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Point Holdings — preference/bonus points per state/species
export const pointHoldings = pgTable("point_holdings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  species: varchar("species", { length: 100 }).notNull(),
  pointType: varchar("point_type", { length: 50 }).notNull(), // preference, bonus, loyalty
  points: integer("points").notNull().default(0),
  asOfYear: integer("as_of_year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Application History
export const applicationHistory = pgTable("application_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  species: varchar("species", { length: 100 }).notNull(),
  huntUnit: varchar("hunt_unit", { length: 50 }),
  year: integer("year").notNull(),
  weaponType: varchar("weapon_type", { length: 50 }),
  choiceNumber: integer("choice_number"),
  wasDrawn: boolean("was_drawn").default(false),
  pointsAtTime: integer("points_at_time"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Harvest History
export const harvestHistory = pgTable("harvest_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  species: varchar("species", { length: 100 }).notNull(),
  huntUnit: varchar("hunt_unit", { length: 50 }),
  year: integer("year").notNull(),
  weaponType: varchar("weapon_type", { length: 50 }),
  wasSuccessful: boolean("was_successful").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(hunterPreferences, {
    fields: [users.id],
    references: [hunterPreferences.userId],
  }),
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
}));

export const applicationHistoryRelations = relations(
  applicationHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [applicationHistory.userId],
      references: [users.id],
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
  })
);
