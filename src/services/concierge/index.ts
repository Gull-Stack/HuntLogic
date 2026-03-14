// ========================
// Concierge Services — barrel export
// ========================

// Types
export type {
  OrderItemInput,
  StateFeeBreakdown,
  ServiceFeeBreakdown,
  OrderTotalBreakdown,
  CheckoutLineItem,
  OrderWithItems,
  OrderStatusDetail,
} from "./types";

// Fee calculator
export {
  lookupStateFees,
  lookupServiceFees,
  calculateOrderTotals,
  buildCheckoutLineItems,
  mapUserTierToServiceTier,
} from "./fee-calculator";

// Order service
export {
  createDraftOrder,
  getOrderById,
  listUserOrders,
  addItemToOrder,
  removeItemFromOrder,
  updateDraftOrder,
  initiateCheckout,
  getOrderStatus,
  recalculateOrderTotals,
} from "./order-service";
