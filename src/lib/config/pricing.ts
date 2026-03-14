/**
 * Pricing configuration with DB-first loading.
 * Falls back to defaults when DB is unavailable.
 */

import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema/config";
import { eq } from "drizzle-orm";
import { config } from "@/lib/config";

export interface PricingTier {
  name: string;
  slug: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  features: string[];
  highlighted: boolean;
  ctaLabel: string;
}

export const DEFAULT_PRICING: PricingTier[] = [
  {
    name: "Scout",
    slug: "scout",
    monthlyPrice: 0,
    yearlyPrice: null,
    features: [
      "Basic draw odds lookup",
      "3 state profiles",
      "Community forums access",
      "Email digest (weekly)",
    ],
    highlighted: false,
    ctaLabel: "Get Started Free",
  },
  {
    name: "Hunter",
    slug: "hunter",
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      "Everything in Scout",
      "Unlimited state profiles",
      "AI-powered recommendations",
      "Point tracking & forecasting",
      "Draw odds alerts",
      `${config.app.aiAssistantName} AI concierge`,
    ],
    highlighted: true,
    ctaLabel: "Start Free Trial",
  },
  {
    name: "Outfitter",
    slug: "outfitter",
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: [
      "Everything in Hunter",
      "Multi-year Playbook strategy",
      "Monte Carlo simulations",
      "Priority AI support",
      "API access",
      "Family/group management",
      "Custom alerts & reports",
    ],
    highlighted: false,
    ctaLabel: "Go Pro",
  },
];

// Cache for DB-loaded pricing
let pricingCache: PricingTier[] | null = null;
let pricingLoadedAt = 0;
const PRICING_TTL_MS = config.cache.configTtlMs;

/**
 * Load pricing tiers with DB overrides merged in.
 * DB values in namespace "pricing" override the defaults.
 * Falls back to DEFAULT_PRICING when DB is unavailable.
 */
export async function loadPricingTiers(): Promise<PricingTier[]> {
  if (pricingCache && Date.now() - pricingLoadedAt < PRICING_TTL_MS) {
    return pricingCache;
  }

  try {
    const rows = await db
      .select()
      .from(appConfig)
      .where(eq(appConfig.namespace, "pricing"));

    if (rows.length === 0) {
      pricingCache = DEFAULT_PRICING;
      pricingLoadedAt = Date.now();
      return pricingCache;
    }

    // Build a lookup of DB overrides keyed by tier slug
    const overrides: Record<string, Record<string, unknown>> = {};
    for (const row of rows) {
      // Keys follow the pattern "tier.<slug>.<field>" e.g. "tier.hunter.monthlyPrice"
      const parts = row.key.split(".");
      if (parts[0] === "tier" && parts.length === 3) {
        const [, slug, field] = parts;
        if (!overrides[slug]) overrides[slug] = {};
        overrides[slug][field] = row.value;
      }
    }

    // Check for a full "tiers" key that replaces everything
    const fullOverride = rows.find((r) => r.key === "tiers");
    if (fullOverride && Array.isArray(fullOverride.value)) {
      pricingCache = fullOverride.value as PricingTier[];
      pricingLoadedAt = Date.now();
      return pricingCache;
    }

    // Merge per-field overrides into defaults
    pricingCache = DEFAULT_PRICING.map((tier) => {
      const tierOverrides = overrides[tier.slug];
      if (!tierOverrides) return tier;
      return { ...tier, ...tierOverrides } as PricingTier;
    });

    pricingLoadedAt = Date.now();
    return pricingCache;
  } catch {
    return DEFAULT_PRICING;
  }
}

/**
 * Format a price for display.
 * Returns "Free" for 0, otherwise "$X.XX".
 */
export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `$${price.toFixed(2)}`;
}

/**
 * Format a price with period for display.
 * Returns "Free" for 0, otherwise "$X.XX/mo".
 */
export function formatMonthlyPrice(price: number): string {
  if (price === 0) return "Free";
  return `$${price.toFixed(2)}/mo`;
}
