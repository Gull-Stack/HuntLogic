"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useOpsAuth } from "@/components/providers/OpsAuthProvider";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Play,
  Trophy,
  XCircle,
  User,
  Mail,
  CreditCard,
  MessageSquare,
  UserPlus,
  RotateCcw,
  X,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  stateCode: string;
  stateName?: string;
  speciesSlug: string;
  speciesName?: string;
  residency: "resident" | "non_resident";
  huntType?: string;
  choiceRank?: number;
  stateFee: number;
  serviceFee: number;
  status: string;
  confirmationNumber?: string;
  errorMessage?: string;
  formData?: Record<string, unknown>;
}

interface OpsOrderDetail {
  id: string;
  orderNumber?: string;
  status: string;
  customerName: string;
  customerEmail: string;
  grandTotal: number;
  stateFeesSubtotal: number;
  serviceFeesSubtotal: number;
  createdAt: string;
  paidAt?: string;
  items: OrderItem[];
  paymentMethod?: string;
  paymentAmount?: number;
}

interface LogEntry {
  id: string;
  action: string;
  details?: string;
  agentName?: string;
  createdAt: string;
}

interface OpsAgent {
  id: string;
  name: string;
  email: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; className?: string }> = {
  draft: { label: "Draft", variant: "default", className: "bg-gray-500/10 text-gray-400" },
  pending_payment: { label: "Pending Payment", variant: "warning", className: "bg-amber-500/10 text-amber-400" },
  paid: { label: "Paid", variant: "info", className: "bg-blue-500/10 text-blue-400" },
  in_progress: { label: "In Progress", variant: "info", className: "bg-indigo-500/10 text-indigo-400" },
  submitted: { label: "Submitted", variant: "info", className: "bg-purple-500/10 text-purple-400" },
  completed: { label: "Completed", variant: "success", className: "bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelled", variant: "danger", className: "bg-red-500/10 text-red-400" },
  refunded: { label: "Refunded", variant: "warning", className: "bg-orange-500/10 text-orange-400" },
};

const ITEM_STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; className?: string }> = {
  queued: { label: "Queued", variant: "warning", className: "bg-amber-500/10 text-amber-400" },
  in_progress: { label: "In Progress", variant: "info", className: "bg-blue-500/10 text-blue-400" },
  submitted: { label: "Submitted", variant: "info", className: "bg-purple-500/10 text-purple-400" },
  confirmed: { label: "Confirmed", variant: "success", className: "bg-emerald-500/10 text-emerald-400" },
  drawn: { label: "Drawn", variant: "success", className: "bg-green-500/10 text-green-400" },
  unsuccessful: { label: "Unsuccessful", variant: "default", className: "bg-gray-500/10 text-gray-400" },
  failed: { label: "Failed", variant: "danger", className: "bg-red-500/10 text-red-400" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function formatResidency(residency: string): string {
  return residency === "resident" ? "Resident" : "Non-Resident";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ItemActionButtons({
  item,
  onAction,
  isActing,
}: {
  item: OrderItem;
  onAction: (itemId: string, action: string, payload?: Record<string, string>) => void;
  isActing: boolean;
}) {
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmInput, setShowConfirmInput] = useState(false);
  const [showFailInput, setShowFailInput] = useState(false);

  switch (item.status) {
    case "queued":
      return (
        <button
          onClick={() => onAction(item.id, "start")}
          disabled={isActing}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Start
        </button>
      );

    case "in_progress":
      return (
        <div className="space-y-2">
          {!showConfirmInput ? (
            <button
              onClick={() => setShowConfirmInput(true)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition-colors"
            >
              <Send className="h-3 w-3" />
              Mark Submitted
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="Confirmation #"
                className="w-36 rounded-lg border border-white/10 bg-gray-800 px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => {
                  onAction(item.id, "submit", { confirmationNumber });
                  setShowConfirmInput(false);
                  setConfirmationNumber("");
                }}
                disabled={isActing || !confirmationNumber.trim()}
                className="rounded-lg bg-purple-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
              </button>
              <button
                onClick={() => setShowConfirmInput(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      );

    case "submitted":
      return (
        <button
          onClick={() => onAction(item.id, "confirm")}
          disabled={isActing}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Confirm
        </button>
      );

    case "confirmed":
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(item.id, "drawn")}
            disabled={isActing}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trophy className="h-3 w-3" />}
            Drawn
          </button>
          <button
            onClick={() => onAction(item.id, "unsuccessful")}
            disabled={isActing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Unsuccessful
          </button>
        </div>
      );

    default:
      break;
  }

  // "Mark Failed" is always available unless already failed/drawn/unsuccessful
  const terminalStatuses = ["failed", "drawn", "unsuccessful"];
  if (terminalStatuses.includes(item.status)) return null;

  return (
    <div className="space-y-2">
      {!showFailInput ? (
        <button
          onClick={() => setShowFailInput(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <XCircle className="h-3 w-3" />
          Mark Failed
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="Error reason"
            className="w-40 rounded-lg border border-white/10 bg-gray-800 px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={() => {
              onAction(item.id, "fail", { errorMessage });
              setShowFailInput(false);
              setErrorMessage("");
            }}
            disabled={isActing || !errorMessage.trim()}
            className="rounded-lg bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fail"}
          </button>
          <button
            onClick={() => setShowFailInput(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function RefundModal({
  orderId,
  onClose,
  onRefunded,
}: {
  orderId: string;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleRefund() {
    if (!reason.trim()) {
      setError("Please provide a refund reason.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/ops/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Refund failed");
      }
      onRefunded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Issue Refund</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Refund Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for this refund..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRefund}
              disabled={isSubmitting || !reason.trim()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Processing..." : "Issue Refund"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function OpsOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { opsUser } = useOpsAuth();

  const [order, setOrder] = useState<OpsOrderDetail | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [agents, setAgents] = useState<OpsAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingItemId, setActingItemId] = useState<string | null>(null);

  // Note form state
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Assign form state
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);

  const isSupervisorOrAdmin =
    opsUser?.role === "supervisor" || opsUser?.role === "admin";

  const fetchOrder = useCallback(async () => {
    try {
      const [orderData, logData] = await Promise.all([
        fetchWithCache<{ order: OpsOrderDetail }>(
          `/api/v1/ops/orders/${orderId}`,
          { staleMs: 10_000 }
        ),
        fetchWithCache<{ entries: LogEntry[] }>(
          `/api/v1/ops/orders/${orderId}/log`,
          { staleMs: 10_000 }
        ).catch(() => ({ entries: [] as LogEntry[] })),
      ]);

      setOrder(orderData.order);
      setLogEntries(logData.entries || []);
      setError(null);

      // Fetch agents if supervisor/admin
      if (isSupervisorOrAdmin) {
        try {
          const agentsData = await fetchWithCache<{ agents: OpsAgent[] }>(
            "/api/v1/ops/agents",
            { staleMs: 60_000 }
          );
          setAgents(agentsData.agents || []);
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      console.error("[ops/order-detail] Failed to fetch:", err);
      setError("Failed to load order details.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, isSupervisorOrAdmin]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleItemAction(
    itemId: string,
    action: string,
    payload?: Record<string, string>
  ) {
    setActingItemId(itemId);
    try {
      const res = await fetch(
        `/api/v1/ops/orders/${orderId}/items/${itemId}/action`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...payload }),
        }
      );
      if (!res.ok) throw new Error("Action failed");
      invalidateCache(`/api/v1/ops/orders/${orderId}`);
      invalidateCache(`/api/v1/ops/orders/${orderId}/log`);
      await fetchOrder();
    } catch (err) {
      console.error("[ops/order-detail] Action failed:", err);
      setError("Action failed. Please try again.");
    } finally {
      setActingItemId(null);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/v1/ops/orders/${orderId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      setNoteText("");
      invalidateCache(`/api/v1/ops/orders/${orderId}/log`);
      await fetchOrder();
    } catch (err) {
      console.error("[ops/order-detail] Add note failed:", err);
      setError("Failed to add note.");
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleAssign() {
    if (!selectedAgentId) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/v1/ops/orders/${orderId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      setSelectedAgentId("");
      invalidateCache(`/api/v1/ops/orders/${orderId}`);
      invalidateCache(`/api/v1/ops/orders/${orderId}/log`);
      await fetchOrder();
    } catch (err) {
      console.error("[ops/order-detail] Assign failed:", err);
      setError("Failed to assign agent.");
    } finally {
      setIsAssigning(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Loading / Error States                                           */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-7 w-48 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/ops/orders")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              invalidateCache(`/api/v1/ops/orders/${orderId}`);
              fetchOrder();
            }}
            className="mt-3 text-sm font-medium text-blue-400 underline hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.draft;

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/ops/orders")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </button>

      {/* Order Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20">
            <Package className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {order.orderNumber
                ? `Order #${order.orderNumber}`
                : "Order Details"}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {order.customerName}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {order.customerEmail}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
              <span>Created {formatDate(order.createdAt)}</span>
              {order.paidAt && (
                <>
                  <span>&middot;</span>
                  <span>Paid {formatDate(order.paidAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">
            {formatCurrency(order.grandTotal)}
          </span>
          <Badge
            variant={badge.variant}
            size="md"
            className={badge.className}
          >
            {badge.label}
          </Badge>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Items Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">
          Application Items ({order.items.length})
        </h2>
        {order.items.map((item) => {
          const itemBadge =
            ITEM_STATUS_BADGE[item.status] ?? ITEM_STATUS_BADGE.queued;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-gray-900 p-4 space-y-3"
            >
              {/* Item header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">
                    {item.stateName || item.stateCode} &mdash;{" "}
                    {item.speciesName || item.speciesSlug}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{formatResidency(item.residency)}</span>
                    {item.huntType && (
                      <>
                        <span>&middot;</span>
                        <span>
                          {item.huntType.charAt(0).toUpperCase() +
                            item.huntType.slice(1)}
                        </span>
                      </>
                    )}
                    {item.choiceRank != null && (
                      <>
                        <span>&middot;</span>
                        <span>Choice {item.choiceRank}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge
                  variant={itemBadge.variant}
                  size="sm"
                  className={itemBadge.className}
                >
                  {itemBadge.label}
                </Badge>
              </div>

              {/* Confirmation / error */}
              {item.confirmationNumber && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Confirmation:</span>
                  <span className="font-mono text-emerald-400">
                    {item.confirmationNumber}
                  </span>
                </div>
              )}
              {item.errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {item.errorMessage}
                </div>
              )}

              {/* Fees */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>
                  State Fee: <span className="text-gray-300">{formatCurrency(item.stateFee)}</span>
                </span>
                <span>
                  Service Fee: <span className="text-gray-300">{formatCurrency(item.serviceFee)}</span>
                </span>
              </div>

              {/* Form Data */}
              {item.formData && Object.keys(item.formData).length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-blue-400 hover:text-blue-300">
                    View Form Data
                  </summary>
                  <div className="mt-2 rounded-lg bg-gray-800 p-3 text-xs">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(item.formData).map(([key, value]) => (
                        <div key={key} className="contents">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-300 break-all">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <ItemActionButtons
                  item={item}
                  onAction={handleItemAction}
                  isActing={actingItemId === item.id}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fulfillment Timeline */}
      {logEntries.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Fulfillment Timeline
          </h2>
          <div className="space-y-0">
            {logEntries.map((entry, index) => {
              const isLast = index === logEntries.length - 1;

              return (
                <div key={entry.id} className="flex gap-3">
                  {/* Timeline dot + connector */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/20">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 min-h-[16px] bg-white/10" />
                    )}
                  </div>

                  {/* Entry content */}
                  <div className={cn("pb-4", isLast && "pb-0")}>
                    <p className="text-sm font-medium text-white">
                      {entry.action}
                    </p>
                    {entry.details && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {entry.details}
                      </p>
                    )}
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatDateTime(entry.createdAt)}</span>
                      {entry.agentName && (
                        <>
                          <span>&middot;</span>
                          <span>{entry.agentName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Note */}
      <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-400" />
          Add Note
        </h2>
        <div className="space-y-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note to this order..."
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={isAddingNote || !noteText.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isAddingNote && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAddingNote ? "Adding..." : "Add Note"}
            </button>
          </div>
        </div>
      </div>

      {/* Assign Section (supervisor/admin only) */}
      {isSupervisorOrAdmin && agents.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-400" />
            Assign Agent
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={isAssigning || !selectedAgentId}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isAssigning && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </button>
          </div>
        </div>
      )}

      {/* Payment Info */}
      <div className="rounded-xl border border-white/10 bg-gray-900 p-4">
        <h2 className="mb-3 text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-400" />
          Payment Information
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {formatCurrency(order.paymentAmount ?? order.grandTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Method</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {order.paymentMethod
                ? order.paymentMethod.charAt(0).toUpperCase() +
                  order.paymentMethod.slice(1)
                : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="mt-0.5 text-sm font-medium text-white">
              {order.paidAt ? formatDate(order.paidAt) : "--"}
            </p>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="mt-4 border-t border-white/10 pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">State Fees Subtotal</span>
            <span className="font-medium text-white">
              {formatCurrency(order.stateFeesSubtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Service Fees Subtotal</span>
            <span className="font-medium text-white">
              {formatCurrency(order.serviceFeesSubtotal)}
            </span>
          </div>
          <div className="border-t border-white/10 pt-2 flex items-center justify-between">
            <span className="text-base font-semibold text-white">
              Grand Total
            </span>
            <span className="text-lg font-bold text-emerald-400">
              {formatCurrency(order.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Refund (supervisor/admin) */}
      {isSupervisorOrAdmin &&
        order.status !== "refunded" &&
        order.status !== "cancelled" &&
        order.status !== "draft" && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Issue Refund
            </button>
          </div>
        )}

      {/* Refund Modal */}
      {showRefundModal && (
        <RefundModal
          orderId={orderId}
          onClose={() => setShowRefundModal(false)}
          onRefunded={() => {
            setShowRefundModal(false);
            invalidateCache(`/api/v1/ops/orders/${orderId}`);
            invalidateCache(`/api/v1/ops/orders/${orderId}/log`);
            setIsLoading(true);
            fetchOrder();
          }}
        />
      )}
    </div>
  );
}
