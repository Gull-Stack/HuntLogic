import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { deadlines } from "./intelligence";

// Enums
export const actionStatusEnum = pgEnum("action_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "overdue",
]);

export const actionPriorityEnum = pgEnum("action_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// User Actions — deadline reminders, tasks, to-dos
export const userActions = pgTable("user_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deadlineId: uuid("deadline_id").references(() => deadlines.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: actionStatusEnum("status").default("pending").notNull(),
  priority: actionPriorityEnum("priority").default("medium").notNull(),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reminderSent: boolean("reminder_sent").default(false),
  reminderDate: date("reminder_date"),
  actionUrl: text("action_url"), // link to state agency website, etc.
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const userActionsRelations = relations(userActions, ({ one }) => ({
  user: one(users, {
    fields: [userActions.userId],
    references: [users.id],
  }),
  deadline: one(deadlines, {
    fields: [userActions.deadlineId],
    references: [deadlines.id],
  }),
}));
