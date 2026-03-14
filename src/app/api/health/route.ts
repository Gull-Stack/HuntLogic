import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { config } from "@/lib/config";

interface ServiceCheck {
  status: "healthy" | "unhealthy" | "not_configured";
  latencyMs?: number;
  error?: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: ServiceCheck;
    redis: ServiceCheck;
    meilisearch: ServiceCheck;
  };
}

export async function GET() {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks: {
      database: { status: "unhealthy" },
      redis: { status: "unhealthy" },
      meilisearch: { status: "not_configured" },
    },
  };

  // Check PostgreSQL
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.checks.database = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (error) {
    health.checks.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check Redis
  try {
    const redisUrl = config.redis.url;
    if (!redisUrl) {
      health.checks.redis = { status: "not_configured" };
    } else {
      const redisStart = Date.now();
      // Attempt a lightweight TCP connection check to Redis
      const url = new URL(redisUrl);
      const host = url.hostname || "localhost";
      const port = parseInt(url.port || "6379", 10);

      await new Promise<void>((resolve, reject) => {
        const { createConnection } = require("net");
        const socket = createConnection({ host, port, timeout: 2000 }, () => {
          // Send PING command in Redis protocol
          socket.write("*1\r\n$4\r\nPING\r\n");
        });
        socket.on("data", (data: Buffer) => {
          const response = data.toString();
          socket.destroy();
          if (response.includes("PONG")) {
            resolve();
          } else {
            reject(new Error(`Unexpected Redis response: ${response}`));
          }
        });
        socket.on("timeout", () => {
          socket.destroy();
          reject(new Error("Redis connection timed out"));
        });
        socket.on("error", (err: Error) => {
          socket.destroy();
          reject(err);
        });
      });

      health.checks.redis = {
        status: "healthy",
        latencyMs: Date.now() - redisStart,
      };
    }
  } catch (error) {
    health.checks.redis = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Meilisearch — not configured, skip
  health.checks.meilisearch = { status: "not_configured" };

  // Determine overall status
  const checkStatuses = Object.values(health.checks);
  const realChecks = checkStatuses.filter((c) => c.status !== "not_configured");
  const allHealthy = realChecks.every((c) => c.status === "healthy");
  const allUnhealthy = realChecks.every((c) => c.status === "unhealthy");

  if (allUnhealthy && realChecks.length > 0) {
    health.status = "unhealthy";
  } else if (!allHealthy) {
    health.status = "degraded";
  } else {
    health.status = "healthy";
  }

  const statusCode = health.status === "unhealthy" ? 503 : 200;
  return NextResponse.json(health, { status: statusCode });
}
