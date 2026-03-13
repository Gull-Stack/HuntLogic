import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// ========================
// STATE CREDENTIALS (AES-256-GCM encrypted)
// ========================

export const stateCredentials = pgTable(
  "state_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stateCode: text("state_code").notNull(),
    username: text("username").notNull(), // AES-256-GCM encrypted
    credentialBlob: text("credential_blob").notNull(), // AES-256-GCM encrypted
    lastVerified: timestamp("last_verified", { withTimezone: true }),
    status: text("status").notNull().default("active"), // 'active' | 'expired' | 'failed'
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("state_credentials_user_state_idx").on(
      table.userId,
      table.stateCode
    ),
    index("state_credentials_user_id_idx").on(table.userId),
    index("state_credentials_state_code_idx").on(table.stateCode),
  ]
);

// ========================
// RELATIONS
// ========================

export const stateCredentialsRelations = relations(
  stateCredentials,
  ({ one }) => ({
    user: one(users, {
      fields: [stateCredentials.userId],
      references: [users.id],
    }),
  })
);
