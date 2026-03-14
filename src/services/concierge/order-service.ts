import { db } from "@/lib/db";
import {
  applicationOrders,
  applicationOrderItems,
  fulfillmentLogs,
  states,
  species,
  users,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { config } from "@/lib/config";
import {
  generateOrderNumber,
  createOrGetCustomer,
  createCheckoutSession,
} from "@/services/stripe";
import {
  buildCheckoutLineItems,
  lookupStateFees,
  lookupServiceFees,
} from "./fee-calculator";
import type {
  OrderWithItems,
  OrderStatusDetail,
} from "./types";

// ========================
// Draft order creation
// ========================

/**
 * Create a new draft order for a user.
 * Generates an order number (HL-YYYY-NNNNN) and stores it in metadata.
 */
export async function createDraftOrder(params: {
  userId: string;
  year: number;
  tier: string;
  groupId?: string | null;
}): Promise<typeof applicationOrders.$inferSelect> {
  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(applicationOrders)
    .values({
      userId: params.userId,
      year: params.year,
      tier: params.tier,
      groupId: params.groupId ?? null,
      status: "draft",
      stateFeeTotal: "0",
      serviceFeeTotal: "0",
      grandTotal: "0",
      metadata: { orderNumber },
    })
    .returning();

  if (!order) {
    throw new Error("Failed to create draft order");
  }

  return order;
}

// ========================
// Order retrieval
// ========================

/**
 * Fetch a single order with all its items, including state and species names.
 * Enforces user ownership.
 */
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<OrderWithItems> {
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(
      and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, userId)
      )
    )
    .limit(1);

  if (!order) {
    throw new Error("Order not found or access denied");
  }

  const items = await db
    .select({
      item: applicationOrderItems,
      stateName: states.name,
      stateCode: states.code,
      speciesName: species.commonName,
    })
    .from(applicationOrderItems)
    .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
    .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
    .where(eq(applicationOrderItems.orderId, orderId));

  return {
    order,
    items: items.map((row) => ({
      ...row.item,
      stateName: row.stateName,
      stateCode: row.stateCode,
      speciesName: row.speciesName,
    })),
  };
}

/**
 * List all orders for a user with optional status and year filters.
 * Ordered by createdAt descending.
 */
export async function listUserOrders(
  userId: string,
  filters?: { status?: string; year?: number }
): Promise<Array<typeof applicationOrders.$inferSelect>> {
  const conditions = [eq(applicationOrders.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(applicationOrders.status, filters.status));
  }
  if (filters?.year) {
    conditions.push(eq(applicationOrders.year, filters.year));
  }

  const orders = await db
    .select()
    .from(applicationOrders)
    .where(and(...conditions))
    .orderBy(desc(applicationOrders.createdAt));

  return orders;
}

// ========================
// Item management
// ========================

/**
 * Add a line item to a draft order.
 * Validates the order is in draft status and owned by the user.
 * Recalculates order totals after insertion.
 */
export async function addItemToOrder(params: {
  orderId: string;
  userId: string;
  stateId: string;
  speciesId: string;
  residency: string;
  huntType?: string | null;
  choiceRank?: number;
  huntUnitId?: string | null;
  recommendationId?: string | null;
  credentialId?: string | null;
  formData?: Record<string, unknown>;
}): Promise<typeof applicationOrderItems.$inferSelect> {
  // Validate order ownership and draft status
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(
      and(
        eq(applicationOrders.id, params.orderId),
        eq(applicationOrders.userId, params.userId)
      )
    )
    .limit(1);

  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status !== "draft") {
    throw new Error(`Cannot add items to an order with status "${order.status}"`);
  }

  // Calculate fees for this item
  const stateFees = await lookupStateFees({
    stateId: params.stateId,
    speciesId: params.speciesId,
    year: order.year,
    residency: params.residency,
  });

  const stateFeeSumForItem = stateFees
    .filter((f) => f.required)
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const serviceFeeRows = await lookupServiceFees(order.tier);
  let serviceFeeSumForItem = 0;
  for (const sf of serviceFeeRows) {
    if (sf.isPercentage) {
      serviceFeeSumForItem += stateFeeSumForItem * (parseFloat(sf.amount) / 100);
    } else if (sf.feeType === "per_application") {
      serviceFeeSumForItem += parseFloat(sf.amount);
    }
  }

  const [item] = await db
    .insert(applicationOrderItems)
    .values({
      orderId: params.orderId,
      userId: params.userId,
      stateId: params.stateId,
      speciesId: params.speciesId,
      residency: params.residency,
      huntType: params.huntType ?? null,
      choiceRank: params.choiceRank ?? 1,
      huntUnitId: params.huntUnitId ?? null,
      recommendationId: params.recommendationId ?? null,
      credentialId: params.credentialId ?? null,
      formData: params.formData ?? {},
      stateFee: stateFeeSumForItem.toFixed(2),
      serviceFee: serviceFeeSumForItem.toFixed(2),
      status: "pending",
    })
    .returning();

  if (!item) {
    throw new Error("Failed to add item to order");
  }

  // Recalculate order totals
  await recalculateOrderTotals(params.orderId);

  return item;
}

/**
 * Remove a line item from a draft order.
 * Validates ownership and draft status, then recalculates totals.
 */
export async function removeItemFromOrder(
  orderId: string,
  itemId: string,
  userId: string
): Promise<void> {
  // Validate order ownership and draft status
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(
      and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, userId)
      )
    )
    .limit(1);

  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status !== "draft") {
    throw new Error(`Cannot remove items from an order with status "${order.status}"`);
  }

  // Verify the item belongs to this order
  const [item] = await db
    .select()
    .from(applicationOrderItems)
    .where(
      and(
        eq(applicationOrderItems.id, itemId),
        eq(applicationOrderItems.orderId, orderId)
      )
    )
    .limit(1);

  if (!item) {
    throw new Error("Order item not found");
  }

  await db
    .delete(applicationOrderItems)
    .where(eq(applicationOrderItems.id, itemId));

  // Recalculate order totals
  await recalculateOrderTotals(orderId);
}

// ========================
// Draft order updates
// ========================

/**
 * Update a draft order's editable fields (notes, groupId).
 * Only allows updates on orders with draft status.
 */
export async function updateDraftOrder(
  orderId: string,
  userId: string,
  updates: { notes?: string | null; groupId?: string | null }
): Promise<typeof applicationOrders.$inferSelect> {
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(
      and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, userId)
      )
    )
    .limit(1);

  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status !== "draft") {
    throw new Error(`Cannot update an order with status "${order.status}"`);
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.notes !== undefined) {
    updateData.notes = updates.notes;
  }
  if (updates.groupId !== undefined) {
    updateData.groupId = updates.groupId;
  }

  const [updated] = await db
    .update(applicationOrders)
    .set(updateData)
    .where(eq(applicationOrders.id, orderId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update order");
  }

  return updated;
}

// ========================
// Checkout flow
// ========================

/**
 * Initiate checkout for a draft order.
 * Validates the order has items, builds Stripe line items,
 * creates a Checkout Session, and sets the order to pending_payment.
 * Returns the Stripe Checkout URL.
 */
export async function initiateCheckout(
  orderId: string,
  userId: string
): Promise<string> {
  // Fetch order and validate ownership
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(
      and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, userId)
      )
    )
    .limit(1);

  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status !== "draft") {
    throw new Error(`Cannot checkout an order with status "${order.status}"`);
  }

  // Fetch order items
  const items = await db
    .select()
    .from(applicationOrderItems)
    .where(eq(applicationOrderItems.orderId, orderId));

  if (items.length === 0) {
    throw new Error("Cannot checkout an empty order");
  }

  // Fetch user for Stripe customer creation
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Build Stripe line items from order items
  const checkoutLineItems = await buildCheckoutLineItems(order, items);

  // Create or retrieve Stripe Customer
  const customerId = await createOrGetCustomer({
    id: user.id,
    email: user.email,
    name: user.displayName,
  });

  // Extract order number from metadata
  const orderMetadata = order.metadata as Record<string, unknown>;
  const orderNumber = (orderMetadata.orderNumber as string) ?? order.id;

  // Create Stripe Checkout Session
  const appUrl = config.app.url;
  const session = await createCheckoutSession({
    customerId,
    orderId: order.id,
    orderNumber,
    lineItems: checkoutLineItems,
    successUrl: `${appUrl}/concierge/orders/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/concierge/orders/${order.id}`,
  });

  // Update order status to pending_payment
  await db
    .update(applicationOrders)
    .set({
      status: "pending_payment",
      stripePaymentIntentId: session.payment_intent as string | null,
      updatedAt: new Date(),
    })
    .where(eq(applicationOrders.id, orderId));

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return session.url;
}

// ========================
// Order status
// ========================

/**
 * Get full order status including item statuses and fulfillment logs.
 * Enforces user ownership.
 */
export async function getOrderStatus(
  orderId: string,
  userId: string
): Promise<OrderStatusDetail> {
  const [order] = await db
    .select()
    .from(applicationOrders)
    .where(
      and(
        eq(applicationOrders.id, orderId),
        eq(applicationOrders.userId, userId)
      )
    )
    .limit(1);

  if (!order) {
    throw new Error("Order not found or access denied");
  }

  const items = await db
    .select({
      item: applicationOrderItems,
      stateName: states.name,
      stateCode: states.code,
      speciesName: species.commonName,
    })
    .from(applicationOrderItems)
    .innerJoin(states, eq(applicationOrderItems.stateId, states.id))
    .innerJoin(species, eq(applicationOrderItems.speciesId, species.id))
    .where(eq(applicationOrderItems.orderId, orderId));

  const logs = await db
    .select()
    .from(fulfillmentLogs)
    .where(eq(fulfillmentLogs.orderId, orderId))
    .orderBy(desc(fulfillmentLogs.createdAt));

  return {
    order,
    items: items.map((row) => ({
      ...row.item,
      stateName: row.stateName,
      stateCode: row.stateCode,
      speciesName: row.speciesName,
    })),
    fulfillmentLogs: logs,
  };
}

// ========================
// Internal helpers
// ========================

/**
 * Recompute state fee total, service fee total, and grand total
 * from all items in the order, then update the order record.
 */
export async function recalculateOrderTotals(orderId: string): Promise<void> {
  const items = await db
    .select({
      stateFee: applicationOrderItems.stateFee,
      serviceFee: applicationOrderItems.serviceFee,
    })
    .from(applicationOrderItems)
    .where(eq(applicationOrderItems.orderId, orderId));

  let stateFeeTotal = 0;
  let serviceFeeTotal = 0;

  for (const item of items) {
    stateFeeTotal += parseFloat(item.stateFee);
    serviceFeeTotal += parseFloat(item.serviceFee);
  }

  const grandTotal = stateFeeTotal + serviceFeeTotal;

  await db
    .update(applicationOrders)
    .set({
      stateFeeTotal: stateFeeTotal.toFixed(2),
      serviceFeeTotal: serviceFeeTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(applicationOrders.id, orderId));
}
