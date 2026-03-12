/**
 * Application configuration loader.
 * Centralizes access to environment variables with type safety.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string = ""): string {
  return process.env[key] || fallback;
}

export const config = {
  app: {
    url: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    name: optionalEnv("NEXT_PUBLIC_APP_NAME", "HuntLogic Concierge"),
    env: optionalEnv("NODE_ENV", "development"),
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
  },

  database: {
    url: () => requireEnv("DATABASE_URL"),
    poolSize: Number(optionalEnv("DATABASE_POOL_SIZE", "10")),
  },

  redis: {
    url: optionalEnv("REDIS_URL", "redis://localhost:6379"),
    password: optionalEnv("REDIS_PASSWORD"),
  },

  auth: {
    secret: () => requireEnv("NEXTAUTH_SECRET"),
    url: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
  },

  ai: {
    apiKey: () => requireEnv("ANTHROPIC_API_KEY"),
    model: optionalEnv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),
    advancedModel: optionalEnv(
      "ANTHROPIC_MODEL_ADVANCED",
      "claude-sonnet-4-20250514"
    ),
  },

  search: {
    host: optionalEnv("MEILISEARCH_HOST", "http://localhost:7700"),
    apiKey: optionalEnv("MEILISEARCH_API_KEY"),
  },

  storage: {
    endpoint: optionalEnv("MINIO_ENDPOINT", "localhost"),
    port: Number(optionalEnv("MINIO_PORT", "9000")),
    accessKey: optionalEnv("MINIO_ACCESS_KEY"),
    secretKey: optionalEnv("MINIO_SECRET_KEY"),
    bucket: optionalEnv("MINIO_BUCKET", "huntlogic-data"),
    useSSL: optionalEnv("MINIO_USE_SSL", "false") === "true",
  },

  forecasting: {
    apiUrl: optionalEnv("FORECASTING_API_URL", "http://localhost:8000"),
  },

  features: {
    aiChat: optionalEnv("ENABLE_AI_CHAT", "true") === "true",
    forecasting: optionalEnv("ENABLE_FORECASTING", "true") === "true",
    pushNotifications:
      optionalEnv("ENABLE_PUSH_NOTIFICATIONS", "false") === "true",
    mapFeatures: optionalEnv("ENABLE_MAP_FEATURES", "true") === "true",
  },
} as const;

export type AppConfig = typeof config;
