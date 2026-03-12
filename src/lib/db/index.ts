import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as users from "./schema/users";
import * as hunting from "./schema/hunting";
import * as intelligence from "./schema/intelligence";
import * as recommendations from "./schema/recommendations";
import * as actions from "./schema/actions";
import * as dataSources from "./schema/data-sources";
import * as config from "./schema/config";

const connectionString = process.env.DATABASE_URL!;

// Connection pool for queries
const queryClient = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_SIZE) || 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, {
  schema: {
    ...users,
    ...hunting,
    ...intelligence,
    ...recommendations,
    ...actions,
    ...dataSources,
    ...config,
  },
});

export type Database = typeof db;
