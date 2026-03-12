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
  date,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { states, species, huntUnits } from "./hunting";

// Enums
export const weaponTypeEnum = pgEnum("weapon_type", [
  "rifle",
  "archery",
  "muzzleloader",
  "shotgun",
  "any",
]);

export const residencyEnum = pgEnum("residency", [
  "resident",
  "nonresident",
]);

// Draw Odds — historical draw odds data
export const drawOdds = pgTable(
  "draw_odds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    weaponType: weaponTypeEnum("weapon_type").notNull(),
    residency: residencyEnum("residency").notNull(),
    choiceNumber: integer("choice_number").default(1),
    pointsRequired: integer("points_required"),
    totalApplicants: integer("total_applicants"),
    totalTags: integer("total_tags"),
    drawRate: doublePrecision("draw_rate"), // 0.0 to 1.0
    pointsToGuarantee: integer("points_to_guarantee"),
    pointsToFiftyPercent: integer("points_to_fifty_percent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("draw_odds_unique_idx").on(
      table.stateId,
      table.speciesId,
      table.huntUnitId,
      table.year,
      table.weaponType,
      table.residency,
      table.choiceNumber
    ),
  ]
);

// Harvest Stats — historical harvest statistics
export const harvestStats = pgTable(
  "harvest_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
    weaponType: weaponTypeEnum("weapon_type"),
    totalHunters: integer("total_hunters"),
    totalHarvest: integer("total_harvest"),
    successRate: doublePrecision("success_rate"), // 0.0 to 1.0
    averageDaysHunted: doublePrecision("average_days_hunted"),
    matureAnimalPercent: doublePrecision("mature_animal_percent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("harvest_stats_unique_idx").on(
      table.stateId,
      table.speciesId,
      table.huntUnitId,
      table.year,
      table.weaponType
    ),
  ]
);

// Seasons — hunting season definitions
export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
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
  seasonName: varchar("season_name", { length: 255 }).notNull(),
  weaponType: weaponTypeEnum("weapon_type"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  applicationDeadline: date("application_deadline"),
  totalTags: integer("total_tags"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Deadlines — application deadlines and important dates
export const deadlines = pgTable("deadlines", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateId: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "cascade" }),
  speciesId: uuid("species_id").references(() => species.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadlineDate: date("deadline_date").notNull(),
  deadlineType: varchar("deadline_type", { length: 50 }).notNull(), // application, point_purchase, results, season_start
  year: integer("year").notNull(),
  url: text("url"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const drawOddsRelations = relations(drawOdds, ({ one }) => ({
  state: one(states, {
    fields: [drawOdds.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [drawOdds.speciesId],
    references: [species.id],
  }),
  huntUnit: one(huntUnits, {
    fields: [drawOdds.huntUnitId],
    references: [huntUnits.id],
  }),
}));

export const harvestStatsRelations = relations(harvestStats, ({ one }) => ({
  state: one(states, {
    fields: [harvestStats.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [harvestStats.speciesId],
    references: [species.id],
  }),
  huntUnit: one(huntUnits, {
    fields: [harvestStats.huntUnitId],
    references: [huntUnits.id],
  }),
}));

export const seasonsRelations = relations(seasons, ({ one }) => ({
  state: one(states, {
    fields: [seasons.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [seasons.speciesId],
    references: [species.id],
  }),
  huntUnit: one(huntUnits, {
    fields: [seasons.huntUnitId],
    references: [huntUnits.id],
  }),
}));

export const deadlinesRelations = relations(deadlines, ({ one }) => ({
  state: one(states, {
    fields: [deadlines.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [deadlines.speciesId],
    references: [species.id],
  }),
}));
