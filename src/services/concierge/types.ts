import type { InferSelectModel } from "drizzle-orm";
import type {
  applicationOrders,
  applicationOrderItems,
  fulfillmentLogs,
} from "@/lib/db/schema";

// ========================
// Input types
// ========================

/** Input for adding a line item to a draft order. */
export interface OrderItemInput {
  stateId: string;
  speciesId: string;
  residency: "resident" | "nonresident";
  huntType?: string | null;
  choiceRank?: number;
  huntUnitId?: string | null;
  recommendationId?: string | null;
  credentialId?: string | null;
  formData?: Record<string, unknown>;
}

// ========================
// Fee breakdown types
// ========================

/** A single state fee line item from state_fee_schedules. */
export interface StateFeeBreakdown {
  feeType: string;
  feeName: string;
  amount: string; // decimal string from DB
  required: boolean;
  notes: string | null;
}

/** A single HuntLogic service fee line item from service_fee_config. */
export interface ServiceFeeBreakdown {
  feeType: string;
  label: string;
  amount: string; // decimal string from DB
  isPercentage: boolean;
}

/** Full order total breakdown with all line items. */
export interface OrderTotalBreakdown {
  stateFeeTotal: string;
  serviceFeeTotal: string;
  grandTotal: string;
  lineItems: Array<{
    stateId: string;
    speciesId: string;
    residency: string;
    stateFees: StateFeeBreakdown[];
    serviceFees: ServiceFeeBreakdown[];
    stateSubtotal: string;
    serviceSubtotal: string;
    itemTotal: string;
  }>;
}

// ========================
// Stripe checkout types
// ========================

/** Line item formatted for Stripe Checkout. Amounts are in cents. */
export interface CheckoutLineItem {
  name: string;
  description?: string;
  amount: number; // in cents
  quantity: number;
}

// ========================
// Order query types
// ========================

/** Order with joined items including state and species names. */
export interface OrderWithItems {
  order: InferSelectModel<typeof applicationOrders>;
  items: Array<
    InferSelectModel<typeof applicationOrderItems> & {
      stateName: string;
      stateCode: string;
      speciesName: string;
    }
  >;
}

/** Full order status detail with item statuses and fulfillment log. */
export interface OrderStatusDetail {
  order: InferSelectModel<typeof applicationOrders>;
  items: Array<
    InferSelectModel<typeof applicationOrderItems> & {
      stateName: string;
      stateCode: string;
      speciesName: string;
    }
  >;
  fulfillmentLogs: Array<InferSelectModel<typeof fulfillmentLogs>>;
}
