// ========================
// Ops fulfillment type definitions
// ========================

export interface OpsSession {
  opsUserId: string;
  email: string;
  displayName: string;
  role: "admin" | "supervisor" | "agent";
  assignedStates: string[];
}

export interface QueueItem {
  itemId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  stateCode: string;
  stateName: string;
  speciesSlug: string;
  speciesName: string;
  residency: string;
  huntType: string | null;
  choiceRank: number;
  stateFee: string;
  serviceFee: string;
  status: string;
  createdAt: string;
  assignedAgent: string | null;
}

export interface QueueFilters {
  status?: string;
  stateCode?: string;
  agentId?: string;
  page?: number;
  limit?: number;
}

export interface OpsOrderDetail {
  order: any; // full order record
  items: any[]; // items with state/species joins
  payments: any[];
  refunds: any[];
  fulfillmentLogs: any[];
  customer: {
    id: string;
    email: string;
    displayName: string | null;
    tier: string;
    phone: string | null;
  };
}

export interface StatusTransition {
  itemId: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  opsUserId: string;
  confirmationNumber?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface AssignmentResult {
  orderId: string;
  agentId: string;
  agentName: string;
  assignedAt: Date;
}

export interface AgentWithLoad {
  id: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  assignedStates: string[];
  maxConcurrent: number;
  currentLoad: number;
}

export interface OpsMetrics {
  queuedCount: number;
  inProgressCount: number;
  completedToday: number;
  failedCount: number;
  revenueToday: number;
  revenueThisWeek: number;
}
