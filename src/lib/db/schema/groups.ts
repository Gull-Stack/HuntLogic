import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// ========================
// HUNT GROUPS
// ========================

export const huntGroups = pgTable(
  "hunt_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description"),
    targetYear: integer("target_year"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("hunt_groups_owner_id_idx").on(table.ownerId),
  ]
);

// ========================
// HUNT GROUP MEMBERS
// ========================

export const huntGroupMembers = pgTable(
  "hunt_group_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => huntGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    role: text("role").notNull().default("member"), // 'owner' | 'member'
    status: text("status").notNull().default("invited"), // 'active' | 'invited' | 'declined'
    joinedAt: timestamp("joined_at", { withTimezone: true }),
  },
  (table) => [
    index("hunt_group_members_group_id_idx").on(table.groupId),
    index("hunt_group_members_user_id_idx").on(table.userId),
    index("hunt_group_members_email_idx").on(table.email),
  ]
);

// ========================
// HUNT GROUP PLANS
// ========================

export const huntGroupPlans = pgTable(
  "hunt_group_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => huntGroups.id, { onDelete: "cascade" }),
    stateCode: text("state_code").notNull(),
    speciesSlug: text("species_slug").notNull(),
    unitCode: text("unit_code"),
    year: integer("year").notNull(),
    notes: text("notes"),
    status: text("status").notNull().default("proposed"), // 'proposed' | 'confirmed' | 'completed'
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("hunt_group_plans_group_id_idx").on(table.groupId),
  ]
);

// ========================
// RELATIONS
// ========================

export const huntGroupsRelations = relations(huntGroups, ({ one, many }) => ({
  owner: one(users, {
    fields: [huntGroups.ownerId],
    references: [users.id],
  }),
  members: many(huntGroupMembers),
  plans: many(huntGroupPlans),
}));

export const huntGroupMembersRelations = relations(
  huntGroupMembers,
  ({ one }) => ({
    group: one(huntGroups, {
      fields: [huntGroupMembers.groupId],
      references: [huntGroups.id],
    }),
    user: one(users, {
      fields: [huntGroupMembers.userId],
      references: [users.id],
    }),
  })
);

export const huntGroupPlansRelations = relations(
  huntGroupPlans,
  ({ one }) => ({
    group: one(huntGroups, {
      fields: [huntGroupPlans.groupId],
      references: [huntGroups.id],
    }),
  })
);
