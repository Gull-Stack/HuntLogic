import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// ========================
// OUTFITTERS
// ========================

export const outfitters = pgTable(
  "outfitters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    website: text("website"),
    phone: text("phone"),
    email: text("email"),
    stateCode: text("state_code").notNull(),
    speciesSlugs: jsonb("species_slugs").notNull().default([]),
    unitCodes: jsonb("unit_codes").notNull().default([]),
    huntTypes: jsonb("hunt_types").notNull().default([]),
    priceRange: text("price_range"), // 'budget' | 'mid' | 'premium' | 'luxury'
    rating: real("rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    description: text("description"),
    verified: boolean("verified").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("outfitters_state_code_idx").on(table.stateCode),
    index("outfitters_rating_idx").on(table.rating),
    index("outfitters_enabled_idx").on(table.enabled),
  ]
);

// ========================
// OUTFITTER REVIEWS
// ========================

export const outfitterReviews = pgTable(
  "outfitter_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    outfitterId: uuid("outfitter_id")
      .notNull()
      .references(() => outfitters.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    rating: integer("rating").notNull(),
    review: text("review"),
    huntSuccess: boolean("hunt_success"),
    verifiedClient: boolean("verified_client").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("outfitter_reviews_outfitter_id_idx").on(table.outfitterId),
    index("outfitter_reviews_user_id_idx").on(table.userId),
  ]
);

// ========================
// RELATIONS
// ========================

export const outfittersRelations = relations(outfitters, ({ many }) => ({
  reviews: many(outfitterReviews),
}));

export const outfitterReviewsRelations = relations(
  outfitterReviews,
  ({ one }) => ({
    outfitter: one(outfitters, {
      fields: [outfitterReviews.outfitterId],
      references: [outfitters.id],
    }),
    user: one(users, {
      fields: [outfitterReviews.userId],
      references: [users.id],
    }),
  })
);
