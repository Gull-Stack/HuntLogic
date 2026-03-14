import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";
import { config } from "@/lib/config";
import { eq, like } from "drizzle-orm";

export interface TenantConfig {
  id: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  ctaGradient: string;
  supportEmail: string;
  featuresEnabled: string[];
}

const DEFAULT_CONFIG: TenantConfig = {
  id: "huntlogic",
  brandName: config.app.brandName,
  logoUrl: "/logo.svg",
  primaryColor: "#1A3C2A",
  ctaGradient: "linear-gradient(135deg, #C4651A, #D4A03C)",
  supportEmail: config.app.supportEmail,
  featuresEnabled: ["all"],
};

// In-memory cache with configurable TTL
const cache = new Map<string, { config: TenantConfig; expiry: number }>();

/**
 * Detect tenant from request headers/hostname.
 * Priority: x-tenant-id header → subdomain → default "huntlogic"
 */
export function detectTenant(headers?: Headers, hostname?: string): string {
  // 1. Check header
  if (headers) {
    const tenantHeader = headers.get("x-tenant-id");
    if (tenantHeader) return tenantHeader.toLowerCase();
  }

  // 2. Parse subdomain
  if (hostname) {
    const parts = hostname.split(".");
    // e.g., partner.huntlogic.com → "partner"
    if (parts.length >= 3 && parts[0] !== "www") {
      return parts[0]!.toLowerCase();
    }
  }

  // 3. Default
  return "huntlogic";
}

/**
 * Load tenant configuration from app_config table.
 * Caches result in-memory with 1-hour TTL.
 */
export async function getTenantConfig(
  tenantId: string
): Promise<TenantConfig> {
  // Check cache
  const cached = cache.get(tenantId);
  if (cached && cached.expiry > Date.now()) return cached.config;

  try {
    const prefix = `tenant.${tenantId}.`;
    const rows = await db
      .select()
      .from(appConfig)
      .where(
        like(appConfig.key, `${prefix}%`)
      );

    if (rows.length === 0) {
      // No tenant config found — use defaults
      cache.set(tenantId, {
        config: DEFAULT_CONFIG,
        expiry: Date.now() + config.cache.configTtlMs,
      });
      return DEFAULT_CONFIG;
    }

    // Parse config from rows
    const configMap = new Map<string, unknown>();
    for (const row of rows) {
      const key = row.key.replace(prefix, "");
      configMap.set(key, row.value);
    }

    const tenantCfg: TenantConfig = {
      id: tenantId,
      brandName: (configMap.get("brand_name") as string) ?? DEFAULT_CONFIG.brandName,
      logoUrl: (configMap.get("logo_url") as string) ?? DEFAULT_CONFIG.logoUrl,
      primaryColor: (configMap.get("primary_color") as string) ?? DEFAULT_CONFIG.primaryColor,
      ctaGradient: (configMap.get("cta_gradient") as string) ?? DEFAULT_CONFIG.ctaGradient,
      supportEmail: (configMap.get("support_email") as string) ?? DEFAULT_CONFIG.supportEmail,
      featuresEnabled: (configMap.get("features_enabled") as string[]) ?? DEFAULT_CONFIG.featuresEnabled,
    };

    cache.set(tenantId, { config: tenantCfg, expiry: Date.now() + config.cache.configTtlMs });
    return tenantCfg;
  } catch (error) {
    console.error("[tenant] Failed to load config:", error);
    return DEFAULT_CONFIG;
  }
}
