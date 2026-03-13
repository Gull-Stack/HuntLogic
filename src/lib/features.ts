import type { TenantConfig } from "./tenant";

/**
 * Check if a feature is enabled for the given tenant.
 * If featuresEnabled includes "all", every feature is enabled.
 */
export function isFeatureEnabled(
  tenantConfig: TenantConfig,
  featureName: string
): boolean {
  if (tenantConfig.featuresEnabled.includes("all")) return true;
  return tenantConfig.featuresEnabled.includes(featureName);
}
