import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

const TENANT_CONFIGS = [
  {
    namespace: "tenant" as const,
    key: "tenant.huntlogic.brand_name",
    value: "HuntLogic",
    description: "Default tenant brand name",
  },
  {
    namespace: "tenant" as const,
    key: "tenant.huntlogic.logo_url",
    value: "/logo.svg",
    description: "Default tenant logo URL",
  },
  {
    namespace: "tenant" as const,
    key: "tenant.huntlogic.primary_color",
    value: "#1A3C2A",
    description: "Default tenant primary color",
  },
  {
    namespace: "tenant" as const,
    key: "tenant.huntlogic.cta_gradient",
    value: "linear-gradient(135deg, #C4651A, #D4A03C)",
    description: "Default tenant CTA gradient",
  },
  {
    namespace: "tenant" as const,
    key: "tenant.huntlogic.support_email",
    value: "support@huntlogic.com",
    description: "Default tenant support email",
  },
  {
    namespace: "tenant" as const,
    key: "tenant.huntlogic.features_enabled",
    value: ["all"],
    description: "Default tenant — all features enabled",
  },
];

export async function seedTenantDefaults() {
  console.log("Seeding tenant defaults...");

  for (const config of TENANT_CONFIGS) {
    await db
      .insert(appConfig)
      .values(config)
      .onConflictDoUpdate({
        target: [appConfig.namespace, appConfig.key],
        set: {
          value: config.value,
          description: config.description,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`Seeded ${TENANT_CONFIGS.length} tenant config entries.`);
}
