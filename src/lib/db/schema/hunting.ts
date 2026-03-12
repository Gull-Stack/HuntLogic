import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// States — supported hunting states
export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 2 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  agencyName: varchar("agency_name", { length: 255 }),
  agencyUrl: text("agency_url"),
  drawSystem: varchar("draw_system", { length: 100 }), // preference, bonus, hybrid, random
  pointSystem: varchar("point_system", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Species
export const species = pgTable("species", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // big_game, small_game, waterfowl
  description: text("description"),
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// State-Species junction — which species are available in which states
export const stateSpecies = pgTable(
  "state_species",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    speciesId: uuid("species_id")
      .notNull()
      .references(() => species.id, { onDelete: "cascade" }),
    hasDrawSystem: boolean("has_draw_system").default(true),
    hasPointSystem: boolean("has_point_system").default(true),
    pointType: varchar("point_type", { length: 50 }), // preference, bonus, loyalty
    maxPoints: integer("max_points"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("state_species_unique_idx").on(table.stateId, table.speciesId),
  ]
);

// Hunt Units — geographic hunting units/areas
export const huntUnits = pgTable("hunt_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  stateId: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  areaSquareMiles: doublePrecision("area_square_miles"),
  publicLandPercent: doublePrecision("public_land_percent"),
  elevationMin: integer("elevation_min"),
  elevationMax: integer("elevation_max"),
  terrain: varchar("terrain", { length: 100 }),
  access: varchar("access", { length: 100 }),
  // PostGIS geometry stored separately — will use raw SQL for spatial queries
  boundaryGeojson: jsonb("boundary_geojson"),
  centroidLat: doublePrecision("centroid_lat"),
  centroidLng: doublePrecision("centroid_lng"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const statesRelations = relations(states, ({ many }) => ({
  stateSpecies: many(stateSpecies),
  huntUnits: many(huntUnits),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  stateSpecies: many(stateSpecies),
}));

export const stateSpeciesRelations = relations(stateSpecies, ({ one }) => ({
  state: one(states, {
    fields: [stateSpecies.stateId],
    references: [states.id],
  }),
  species: one(species, {
    fields: [stateSpecies.speciesId],
    references: [species.id],
  }),
}));

export const huntUnitsRelations = relations(huntUnits, ({ one }) => ({
  state: one(states, {
    fields: [huntUnits.stateId],
    references: [states.id],
  }),
}));
