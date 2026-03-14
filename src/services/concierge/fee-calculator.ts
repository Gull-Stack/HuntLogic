import { db } from "@/lib/db";
import {
  stateFeeSchedules,
  serviceFeeConfig,
  states,
  species,
} from "@/lib/db/schema";
import { eq, and, lte, gte, or, isNull } from "drizzle-orm";
import { config } from "@/lib/config";
import type {
  OrderItemInput,
  StateFeeBreakdown,
  ServiceFeeBreakdown,
  OrderTotalBreakdown,
  CheckoutLineItem,
} from "./types";

// ========================
// Tier mapping
// ========================

const USER_TIER_TO_SERVICE_TIER: Record<string, string> = {
  scout: "default",
  pro: "hunter",
  elite: "outfitter",
};

/**
 * Maps a user-facing tier (scout/pro/elite) to the internal
 * service fee config tier (default/hunter/outfitter).
 */
export function mapUserTierToServiceTier(userTier: string): string {
  const mapped = USER_TIER_TO_SERVICE_TIER[userTier];
  if (!mapped) {
    throw new Error(`Unknown user tier: ${userTier}`);
  }
  return mapped;
}

// ========================
// State fee lookup
// ========================

/**
 * Look up all applicable state fees for a given state, species, year, and residency.
 * Returns an array of fee line items from the state_fee_schedules table.
 */
export async function lookupStateFees(params: {
  stateId: string;
  speciesId: string;
  year: number;
  residency: string;
}): Promise<StateFeeBreakdown[]> {
  const rows = await db
    .select({
      feeType: stateFeeSchedules.feeType,
      feeName: stateFeeSchedules.feeName,
      amount: stateFeeSchedules.amount,
      required: stateFeeSchedules.required,
      notes: stateFeeSchedules.notes,
    })
    .from(stateFeeSchedules)
    .where(
      and(
        eq(stateFeeSchedules.stateId, params.stateId),
        eq(stateFeeSchedules.speciesId, params.speciesId),
        eq(stateFeeSchedules.year, params.year),
        eq(stateFeeSchedules.residency, params.residency)
      )
    );

  return rows;
}

// ========================
// Service fee lookup
// ========================

/**
 * Look up all active service fees for a given user tier.
 * Resolves the user tier to service tier internally.
 * Only returns fees that are currently effective (effectiveFrom <= now, effectiveUntil is null or > now).
 */
export async function lookupServiceFees(
  userTier: string
): Promise<ServiceFeeBreakdown[]> {
  const serviceTier = mapUserTierToServiceTier(userTier);
  const now = new Date();

  const rows = await db
    .select({
      feeType: serviceFeeConfig.feeType,
      label: serviceFeeConfig.label,
      amount: serviceFeeConfig.amount,
      isPercentage: serviceFeeConfig.isPercentage,
    })
    .from(serviceFeeConfig)
    .where(
      and(
        eq(serviceFeeConfig.tier, serviceTier),
        eq(serviceFeeConfig.active, true),
        lte(serviceFeeConfig.effectiveFrom, now),
        or(
          isNull(serviceFeeConfig.effectiveUntil),
          gte(serviceFeeConfig.effectiveUntil, now)
        )
      )
    );

  return rows;
}

// ========================
// Order total calculation
// ========================

/**
 * Calculate full order totals given a set of order items and the user's tier.
 * Sums all state fees + service fees per item, then rolls up to order-level totals.
 */
export async function calculateOrderTotals(
  items: OrderItemInput[],
  userTier: string,
  year: number
): Promise<OrderTotalBreakdown> {
  const serviceFees = await lookupServiceFees(userTier);

  let overallStateFeeTotal = 0;
  let overallServiceFeeTotal = 0;

  const lineItems: OrderTotalBreakdown["lineItems"] = [];

  for (const item of items) {
    const stateFees = await lookupStateFees({
      stateId: item.stateId,
      speciesId: item.speciesId,
      year,
      residency: item.residency,
    });

    // Sum all required state fees for this item
    const stateSubtotal = stateFees
      .filter((f) => f.required)
      .reduce((sum, f) => sum + parseFloat(f.amount), 0);

    // Calculate service fees for this item
    let serviceSubtotal = 0;
    for (const sf of serviceFees) {
      if (sf.isPercentage) {
        serviceSubtotal += stateSubtotal * (parseFloat(sf.amount) / 100);
      } else {
        // Flat per-application fees
        if (sf.feeType === "per_application") {
          serviceSubtotal += parseFloat(sf.amount);
        }
      }
    }

    const itemTotal = stateSubtotal + serviceSubtotal;

    overallStateFeeTotal += stateSubtotal;
    overallServiceFeeTotal += serviceSubtotal;

    lineItems.push({
      stateId: item.stateId,
      speciesId: item.speciesId,
      residency: item.residency,
      stateFees,
      serviceFees,
      stateSubtotal: stateSubtotal.toFixed(2),
      serviceSubtotal: serviceSubtotal.toFixed(2),
      itemTotal: itemTotal.toFixed(2),
    });
  }

  const grandTotal = overallStateFeeTotal + overallServiceFeeTotal;

  return {
    stateFeeTotal: overallStateFeeTotal.toFixed(2),
    serviceFeeTotal: overallServiceFeeTotal.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    lineItems,
  };
}

// ========================
// Stripe line item builder
// ========================

/**
 * Build Stripe-compatible checkout line items from an order and its items.
 * Groups state fees and service fees into distinct line items, amounts in cents.
 */
export async function buildCheckoutLineItems(
  order: { year: number },
  items: Array<{
    stateId: string;
    speciesId: string;
    residency: string;
    stateFee: string;
    serviceFee: string;
  }>
): Promise<CheckoutLineItem[]> {
  const checkoutItems: CheckoutLineItem[] = [];

  for (const item of items) {
    // Look up state and species names for descriptive line items
    const [stateRow] = await db
      .select({ name: states.name, code: states.code })
      .from(states)
      .where(eq(states.id, item.stateId))
      .limit(1);

    const [speciesRow] = await db
      .select({ commonName: species.commonName })
      .from(species)
      .where(eq(species.id, item.speciesId))
      .limit(1);

    const stateName = stateRow?.name ?? "Unknown State";
    const stateCode = stateRow?.code ?? "??";
    const speciesName = speciesRow?.commonName ?? "Unknown Species";

    // State fee line item
    const stateFeeAmount = Math.round(parseFloat(item.stateFee) * 100);
    if (stateFeeAmount > 0) {
      checkoutItems.push({
        name: `${stateCode} ${speciesName} - State Fees`,
        description: `${stateName} ${item.residency} application fees (${order.year})`,
        amount: stateFeeAmount,
        quantity: 1,
      });
    }

    // Service fee line item
    const serviceFeeAmount = Math.round(parseFloat(item.serviceFee) * 100);
    if (serviceFeeAmount > 0) {
      checkoutItems.push({
        name: `${stateCode} ${speciesName} - Service Fee`,
        description: `${config.app.brandName} concierge service fee`,
        amount: serviceFeeAmount,
        quantity: 1,
      });
    }
  }

  return checkoutItems;
}
