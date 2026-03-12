import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { states } from "./hunting";

// ========================
// STATE REGULATIONS (official regulation documents per state)
// ========================

export const stateRegulations = pgTable(
  "state_regulations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(), // 'big_game_application' | 'big_game_field_regs' | 'upland_game' | 'waterfowl' | 'turkey' | 'admin_rules' | 'hunt_planner' | 'general_hunting'
    title: text("title").notNull(),
    url: text("url").notNull(),
    format: text("format"), // 'pdf' | 'html' | 'interactive'
    year: integer("year"),
    description: text("description"),
    lastVerified: timestamp("last_verified", { withTimezone: true }),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("state_regulations_state_id_idx").on(table.stateId),
    index("state_regulations_doc_type_idx").on(table.docType),
    index("state_regulations_year_idx").on(table.year),
    index("state_regulations_enabled_idx").on(table.enabled),
    uniqueIndex("state_regulations_unique_idx").on(
      table.stateId,
      table.docType,
      table.year
    ),
  ]
);

// ========================
// RELATIONS
// ========================

export const stateRegulationsRelations = relations(
  stateRegulations,
  ({ one }) => ({
    state: one(states, {
      fields: [stateRegulations.stateId],
      references: [states.id],
    }),
  })
);
