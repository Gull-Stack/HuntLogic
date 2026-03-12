import { NextResponse } from "next/server";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latencyMs?: number; error?: string };
    redis: { status: string; latencyMs?: number; error?: string };
    meilisearch: { status: string; latencyMs?: number; error?: string };
  };
}

export async function GET() {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks: {
      database: { status: "unchecked" },
      redis: { status: "unchecked" },
      meilisearch: { status: "unchecked" },
    },
  };

  // Check PostgreSQL
  try {
    const dbStart = Date.now();
    // TODO: Import db client and run SELECT 1
    // const result = await db.execute(sql`SELECT 1`);
    health.checks.database = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    health.checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    health.status = "degraded";
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    // TODO: Import redis client and run PING
    // const pong = await redis.ping();
    health.checks.redis = {
      status: "healthy",
      latencyMs: Date.now() - redisStart,
    };
  } catch (error) {
    health.checks.redis = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    health.status = "degraded";
  }

  // Check Meilisearch
  try {
    const meiliStart = Date.now();
    // TODO: Import meilisearch client and check health
    // const meiliHealth = await meili.health();
    health.checks.meilisearch = {
      status: "healthy",
      latencyMs: Date.now() - meiliStart,
    };
  } catch (error) {
    health.checks.meilisearch = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
    health.status = "degraded";
  }

  const allUnhealthy = Object.values(health.checks).every(
    (c) => c.status === "unhealthy"
  );
  if (allUnhealthy) {
    health.status = "unhealthy";
  }

  const statusCode = health.status === "unhealthy" ? 503 : 200;
  return NextResponse.json(health, { status: statusCode });
}
