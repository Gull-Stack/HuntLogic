import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ========================
// STATES (fully dynamic, admin-managed)
// ========================

export const states = pgTable(
  "states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(), // 'CO', 'WY', 'AZ', etc.
    name: text("name").notNull(),
    region: text("region"), // 'west' | 'east' | 'midwest' | 'south'
    hasDrawSystem: boolean("has_draw_system").notNull().default(false),
    hasPointSystem: boolean("has_point_system").notNull().default(false),
    agencyName: text("agency_name"),
    agencyUrl: text("agency_url"),
    config: jsonb("config").notNull().default({}), // state-specific configuration blob
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("states_code_idx").on(table.code),
    index("states_region_idx").on(table.region),
    index("states_enabled_idx").on(table.enabled),
  ]
);

// ========================
// SPECIES (dynamic catalog)
// ========================

export const species = pgTable(
  "species",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(), // 'elk', 'mule_deer', 'whitetail', etc.
    commonName: text("common_name").notNull(),
    scientificName: text("scientific_name"),
    category: text("category"), // 'big_game' | 'small_game' | 'waterfowl' | 'turkey' | 'upland'
    config: jsonb("config").notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("species_slug_idx").on(table.slug),
    index("species_category_idx").on(table.category),
    index("species_enabled_idx").on(table.enabled),
  ]
);

// ========================
// STATE-SPECIES (which species are available in which states)
// ========================

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
    huntTypes: jsonb("hunt_types").notNull().default([]), // ['rifle', 'archery', 'muzzleloader']
    hasDraw: boolean("has_draw").notNull().default(false),
    hasOtc: boolean("has_otc").notNull().default(false),
    hasPoints: boolean("has_points").notNull().default(false),
    pointType: text("point_type"), // 'preference' | 'bonus' | 'hybrid'
    maxPoints: integer("max_points"),
    config: jsonb("config").notNull().default({}), // species-in-state specific settings
  },
  (table) => [
    uniqueIndex("state_species_unique_idx").on(table.stateId, table.speciesId),
    index("state_species_state_id_idx").on(table.stateId),
    index("state_species_species_id_idx").on(table.speciesId),
  ]
);

// ========================
// HUNT UNITS (geographic hunting units/areas)
// ========================

export const huntUnits = pgTable(
  "hunt_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    speciesId: uuid("species_id")
      .notNull()
      .references(() => species.id, { onDelete: "cascade" }),
    unitCode: text("unit_code").notNull(),
    unitName: text("unit_name"),
    regionName: text("region_name"),
    publicLandPct: real("public_land_pct"),
    elevationMin: integer("elevation_min"),
    elevationMax: integer("elevation_max"),
    terrainClass: text("terrain_class"), // 'alpine' | 'timber' | 'prairie' | 'desert' | 'mixed'
    accessNotes: text("access_notes"),
    config: jsonb("config").notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
  },
  (table) => [
    uniqueIndex("hunt_units_unique_idx").on(
      table.stateId,
      table.unitCode,
      table.speciesId
    ),
    index("hunt_units_state_id_idx").on(table.stateId),
    index("hunt_units_species_id_idx").on(table.speciesId),
    index("hunt_units_unit_code_idx").on(table.unitCode),
    index("hunt_units_enabled_idx").on(table.enabled),
  ]
);

// ========================
// RELATIONS
// ========================

export const statesRelations = relations(states, ({ many }) => ({
  stateSpecies: many(stateSpecies),
  huntUnits: many(huntUnits),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  stateSpecies: many(stateSpecies),
  huntUnits: many(huntUnits),
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
  species: one(species, {
    fields: [huntUnits.speciesId],
    references: [species.id],
  }),
}));
