import { db } from "@/lib/db";
import { serviceFeeConfig } from "@/lib/db/schema";

// =============================================================================
// Service Fee Seed — HuntLogic Concierge Pricing Tiers
// =============================================================================
// Three tiers: default (no subscription), hunter, outfitter
// Fee types: per_application, point_purchase, per_order, rush
// =============================================================================

interface ServiceFeeEntry {
  tier: string;
  feeType: string;
  label: string;
  amount: string;
  isPercentage: boolean;
  active: boolean;
  metadata: Record<string, unknown>;
}

const SERVICE_FEES: ServiceFeeEntry[] = [
  // ---------------------------------------------------------------------------
  // Default tier (pay-as-you-go, no subscription)
  // ---------------------------------------------------------------------------
  {
    tier: "default",
    feeType: "per_application",
    label: "Application Service Fee",
    amount: "34.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Per-species application submission by HuntLogic concierge",
      includesSupport: true,
    },
  },
  {
    tier: "default",
    feeType: "point_purchase",
    label: "Point Purchase Service Fee",
    amount: "19.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Preference or bonus point purchase on behalf of hunter",
    },
  },
  {
    tier: "default",
    feeType: "per_order",
    label: "Order Processing Fee",
    amount: "4.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "One-time fee per checkout order (covers all apps in order)",
    },
  },
  {
    tier: "default",
    feeType: "rush",
    label: "Rush Processing Fee",
    amount: "15.00",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Priority processing within 24 hours of deadline",
      guaranteedTurnaround: "24h",
    },
  },

  // ---------------------------------------------------------------------------
  // Hunter tier (subscription members)
  // ---------------------------------------------------------------------------
  {
    tier: "hunter",
    feeType: "per_application",
    label: "Application Service Fee (Hunter)",
    amount: "24.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Discounted per-species application for Hunter subscribers",
      savingsVsDefault: "10.00",
    },
  },
  {
    tier: "hunter",
    feeType: "point_purchase",
    label: "Point Purchase Service Fee (Hunter)",
    amount: "14.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Discounted point purchase for Hunter subscribers",
      savingsVsDefault: "5.00",
    },
  },
  {
    tier: "hunter",
    feeType: "per_order",
    label: "Order Processing Fee (Hunter)",
    amount: "0.00",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Waived for Hunter tier subscribers",
      savingsVsDefault: "4.99",
    },
  },
  {
    tier: "hunter",
    feeType: "rush",
    label: "Rush Processing Fee (Hunter)",
    amount: "10.00",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Reduced rush fee for Hunter subscribers",
      guaranteedTurnaround: "24h",
      savingsVsDefault: "5.00",
    },
  },

  // ---------------------------------------------------------------------------
  // Outfitter tier (outfitter/guide partners)
  // ---------------------------------------------------------------------------
  {
    tier: "outfitter",
    feeType: "per_application",
    label: "Application Service Fee (Outfitter)",
    amount: "19.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Best rate per-species application for Outfitter partners",
      savingsVsDefault: "15.00",
      bulkEligible: true,
    },
  },
  {
    tier: "outfitter",
    feeType: "point_purchase",
    label: "Point Purchase Service Fee (Outfitter)",
    amount: "9.99",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Best rate point purchase for Outfitter partners",
      savingsVsDefault: "10.00",
    },
  },
  {
    tier: "outfitter",
    feeType: "per_order",
    label: "Order Processing Fee (Outfitter)",
    amount: "0.00",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Waived for Outfitter tier partners",
      savingsVsDefault: "4.99",
    },
  },
  {
    tier: "outfitter",
    feeType: "rush",
    label: "Rush Processing Fee (Outfitter)",
    amount: "5.00",
    isPercentage: false,
    active: true,
    metadata: {
      description: "Lowest rush fee for Outfitter partners",
      guaranteedTurnaround: "24h",
      savingsVsDefault: "10.00",
    },
  },
];

// =============================================================================
// Seed function
// =============================================================================

export async function seedServiceFees() {
  console.log("Seeding service fee config...");

  const effectiveFrom = new Date("2026-01-01T00:00:00Z");

  const values = SERVICE_FEES.map((fee) => ({
    tier: fee.tier,
    feeType: fee.feeType,
    label: fee.label,
    amount: fee.amount,
    isPercentage: fee.isPercentage,
    active: fee.active,
    effectiveFrom,
    metadata: fee.metadata,
  }));

  const result = await db
    .insert(serviceFeeConfig)
    .values(values)
    .onConflictDoNothing()
    .returning();

  console.log(
    `  -> ${result.length} service fee entries inserted (${values.length} total)`
  );
}
