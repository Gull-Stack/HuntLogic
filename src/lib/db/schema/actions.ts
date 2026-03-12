import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { deadlines } from "./intelligence";

// ========================
// USER ACTIONS (deadline reminders, tasks, to-dos)
// ========================

export const userActions = pgTable(
  "user_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deadlineId: uuid("deadline_id").references(() => deadlines.id, {
      onDelete: "set null",
    }),
    actionType: text("action_type").notNull(), // 'apply' | 'buy_points' | 'verify_hunter_ed' | 'review_strategy' | 'complete_application'
    title: text("title").notNull(),
    description: text("description"),
    dueDate: date("due_date"),
    priority: text("priority").notNull().default("medium"), // 'critical' | 'high' | 'medium' | 'low'
    status: text("status").notNull().default("pending"), // 'pending' | 'in_progress' | 'completed' | 'skipped' | 'missed'
    metadata: jsonb("metadata").notNull().default({}),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("user_actions_user_id_idx").on(table.userId),
    index("user_actions_deadline_id_idx").on(table.deadlineId),
    index("user_actions_status_idx").on(table.status),
    index("user_actions_priority_idx").on(table.priority),
    index("user_actions_due_date_idx").on(table.dueDate),
    index("user_actions_user_status_idx").on(table.userId, table.status),
    index("user_actions_action_type_idx").on(table.actionType),
  ]
);

// ========================
// RELATIONS
// ========================

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
