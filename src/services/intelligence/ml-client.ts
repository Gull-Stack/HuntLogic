/**
 * ML Service Client
 * Communicates with the Python FastAPI ML service for advanced predictions.
 * Gracefully falls back to existing forecast-engine when ML_SERVICE_URL is not set or service is unavailable.
 */

import { config } from "@/lib/config";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const TIMEOUT_MS = 10_000;

// In-memory cache with configurable TTL (default 5 minutes)
const cache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + config.cache.configTtlMs });
}

async function mlFetch<T>(path: string, body: unknown): Promise<T | null> {
  if (!ML_SERVICE_URL) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${ML_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface PointCreepProjection {
  year: number;
  predicted_points: number;
  confidence_low: number;
  confidence_high: number;
}

export interface PointCreepResult {
  projections: PointCreepProjection[];
  changepoints: string[];
  model: string;
}

export interface DrawProbabilityResult {
  probability: number;
  confidence: number;
  feature_importance: Record<string, number>;
  model: string;
}

/**
 * Predict point creep using ML service
 * Returns null if ML service is unavailable
 */
export async function predictPointCreep(
  stateCode: string,
  speciesSlug: string,
  unitCode: string,
  yearsForward: number = 5
): Promise<PointCreepResult | null> {
  const cacheKey = `pc:${stateCode}:${speciesSlug}:${unitCode}:${yearsForward}`;
  const cached = getCached<PointCreepResult>(cacheKey);
  if (cached) return cached;

  const result = await mlFetch<PointCreepResult>("/predict/point-creep", {
    state_code: stateCode,
    species_slug: speciesSlug,
    unit_code: unitCode,
    years_forward: yearsForward,
  });

  if (result) setCache(cacheKey, result);
  return result;
}

/**
 * Predict draw probability using ML service
 * Returns null if ML service is unavailable
 */
export async function predictDrawProbability(
  stateCode: string,
  speciesSlug: string,
  unitCode: string,
  currentPoints: number,
  pointType: string = "preference"
): Promise<DrawProbabilityResult | null> {
  const cacheKey = `dp:${stateCode}:${speciesSlug}:${unitCode}:${currentPoints}:${pointType}`;
  const cached = getCached<DrawProbabilityResult>(cacheKey);
  if (cached) return cached;

  const result = await mlFetch<DrawProbabilityResult>(
    "/predict/draw-probability",
    {
      state_code: stateCode,
      species_slug: speciesSlug,
      unit_code: unitCode,
      current_points: currentPoints,
      point_type: pointType,
    }
  );

  if (result) setCache(cacheKey, result);
  return result;
}

/**
 * Check if ML service is healthy
 */
export async function isMLServiceAvailable(): Promise<boolean> {
  if (!ML_SERVICE_URL) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return false;

    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
