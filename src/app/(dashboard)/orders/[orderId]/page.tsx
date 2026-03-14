"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  CreditCard,
} from "lucide-react";
import { fetchWithCache } from "@/lib/api/cache";

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
}

interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  stateFeesSubtotal: number;
  serviceFeesSubtotal: number;
  grandTotal: number;
  createdAt: string;
  paidAt?: string;
  metadata?: {
    orderNumber?: string;
  };
}

interface FulfillmentStep {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "pending";
  completedAt?: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "outline"; className?: string }> = {
  draft: { label: "Draft", variant: "default" },
  pending_payment: { label: "Pending Payment", variant: "warning" },
  paid: { label: "Paid", variant: "info" },
  in_progress: { label: "In Progress", variant: "info", className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  submitted: { label: "Submitted", variant: "info", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  refunded: { label: "Refunded", variant: "warning", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
};

const ITEM_STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Pending", variant: "default" },
  processing: { label: "Processing", variant: "warning" },
  submitted: { label: "Submitted", variant: "info" },
  confirmed: { label: "Confirmed", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

const TIMELINE_ICONS: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Clock,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatResidency(residency: string): string {
  return residency === "resident" ? "Resident" : "Non-Resident";
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [fulfillmentSteps, setFulfillmentSteps] = useState<FulfillmentStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await fetchWithCache<{ order: Order }>(
        `/api/v1/concierge/orders/${orderId}`,
        { staleMs: 30_000 }
      );
      setOrder(data.order);

      // Fetch fulfillment status if paid or later
      const postPaymentStatuses = ["paid", "in_progress", "submitted", "completed"];
      if (postPaymentStatuses.includes(data.order.status)) {
        try {
          const statusData = await fetchWithCache<{ steps: FulfillmentStep[] }>(
            `/api/v1/concierge/orders/${orderId}/status`,
            { staleMs: 30_000 }
          );
          setFulfillmentSteps(statusData.steps || []);
        } catch {
          // Non-critical — fulfillment timeline may not be available yet
        }
      }
    } catch (err) {
      console.error("[order-detail] Failed to fetch:", err);
      setError("Failed to load order details.");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleCheckout() {
    if (!order) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch(`/api/v1/concierge/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error("[order-detail] Checkout error:", err);
      setError("Failed to start checkout. Please try again.");
      setIsCheckingOut(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-sage/10 motion-safe:animate-pulse" />
          <div className="h-7 w-48 rounded-lg bg-brand-sage/10 motion-safe:animate-pulse" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center gap-2 text-sm text-brand-sage hover:text-brand-forest transition-colors dark:hover:text-brand-cream"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </button>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="text-sm text-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.draft;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/orders")}
        className="flex items-center gap-2 text-sm text-brand-sage hover:text-brand-forest transition-colors dark:hover:text-brand-cream"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </button>

      {/* Order Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-forest/10 dark:bg-brand-sage/20">
            <Package className="h-6 w-6 text-brand-forest dark:text-brand-cream" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
              {order.metadata?.orderNumber
                ? `Order #${order.metadata.orderNumber}`
                : "Order Details"}
            </h1>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-brand-sage">
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

        <Badge
          variant={badge.variant}
          size="md"
          className={badge.className}
        >
          {badge.label}
        </Badge>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Fulfillment Timeline */}
      {fulfillmentSteps.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-4 text-lg font-semibold text-brand-bark dark:text-brand-cream">
              Fulfillment Progress
            </h2>
            <div className="space-y-0">
              {fulfillmentSteps.map((step, index) => {
                const Icon = TIMELINE_ICONS[step.status] ?? Clock;
                const isLast = index === fulfillmentSteps.length - 1;

                return (
                  <div key={step.id} className="flex gap-3">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          step.status === "completed"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : step.status === "in_progress"
                              ? "bg-brand-forest/10 text-brand-forest dark:text-brand-cream"
                              : "bg-brand-sage/10 text-brand-sage"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 min-h-[24px]",
                            step.status === "completed"
                              ? "bg-green-500/30"
                              : "bg-brand-sage/20"
                          )}
                        />
                      )}
                    </div>

                    {/* Step content */}
                    <div className={cn("pb-6", isLast && "pb-0")}>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          step.status === "completed"
                            ? "text-brand-bark dark:text-brand-cream"
                            : step.status === "in_progress"
                              ? "text-brand-forest dark:text-brand-cream"
                              : "text-brand-sage"
                        )}
                      >
                        {step.label}
                      </p>
                      {step.completedAt && (
                        <p className="text-xs text-brand-sage">
                          {formatDate(step.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold text-brand-bark dark:text-brand-cream">
            Applications ({order.items.length})
          </h2>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-sage/10 dark:border-brand-sage/20">
                  <th className="pb-3 text-left font-medium text-brand-sage">State</th>
                  <th className="pb-3 text-left font-medium text-brand-sage">Species</th>
                  <th className="pb-3 text-left font-medium text-brand-sage">Residency</th>
                  <th className="pb-3 text-left font-medium text-brand-sage">Hunt Type</th>
                  <th className="pb-3 text-center font-medium text-brand-sage">Choice</th>
                  <th className="pb-3 text-right font-medium text-brand-sage">State Fee</th>
                  <th className="pb-3 text-right font-medium text-brand-sage">Service Fee</th>
                  <th className="pb-3 text-center font-medium text-brand-sage">Status</th>
                  <th className="pb-3 text-left font-medium text-brand-sage">Confirmation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-sage/10 dark:divide-brand-sage/20">
                {order.items.map((item) => {
                  const itemBadge = ITEM_STATUS_BADGE[item.status] ?? ITEM_STATUS_BADGE.pending;

                  return (
                    <tr key={item.id}>
                      <td className="py-3 font-medium text-brand-bark dark:text-brand-cream">
                        {item.stateName || item.stateCode}
                      </td>
                      <td className="py-3 text-brand-bark dark:text-brand-cream">
                        {item.speciesName || item.speciesSlug}
                      </td>
                      <td className="py-3 text-brand-bark dark:text-brand-cream">
                        {formatResidency(item.residency)}
                      </td>
                      <td className="py-3 text-brand-bark dark:text-brand-cream">
                        {item.huntType ? item.huntType.charAt(0).toUpperCase() + item.huntType.slice(1) : "--"}
                      </td>
                      <td className="py-3 text-center text-brand-bark dark:text-brand-cream">
                        {item.choiceRank ?? "--"}
                      </td>
                      <td className="py-3 text-right text-brand-bark dark:text-brand-cream">
                        {formatCurrency(item.stateFee)}
                      </td>
                      <td className="py-3 text-right text-brand-bark dark:text-brand-cream">
                        {formatCurrency(item.serviceFee)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge variant={itemBadge.variant} size="sm">
                          {itemBadge.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-brand-bark dark:text-brand-cream">
                        {item.confirmationNumber || "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {order.items.map((item) => {
              const itemBadge = ITEM_STATUS_BADGE[item.status] ?? ITEM_STATUS_BADGE.pending;

              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-brand-sage/10 p-3 dark:border-brand-sage/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-brand-bark dark:text-brand-cream">
                        {item.stateName || item.stateCode} &mdash;{" "}
                        {item.speciesName || item.speciesSlug}
                      </p>
                      <p className="text-xs text-brand-sage">
                        {formatResidency(item.residency)}
                        {item.huntType
                          ? ` / ${item.huntType.charAt(0).toUpperCase() + item.huntType.slice(1)}`
                          : ""}
                        {item.choiceRank ? ` / Choice ${item.choiceRank}` : ""}
                      </p>
                    </div>
                    <Badge variant={itemBadge.variant} size="sm">
                      {itemBadge.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-brand-sage">
                    <span>
                      State: {formatCurrency(item.stateFee)} &middot; Service:{" "}
                      {formatCurrency(item.serviceFee)}
                    </span>
                    {item.confirmationNumber && (
                      <span className="font-mono">{item.confirmationNumber}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold text-brand-bark dark:text-brand-cream">
            Fee Breakdown
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-sage">State Fees Subtotal</span>
              <span className="font-medium text-brand-bark dark:text-brand-cream">
                {formatCurrency(order.stateFeesSubtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-sage">Service Fees Subtotal</span>
              <span className="font-medium text-brand-bark dark:text-brand-cream">
                {formatCurrency(order.serviceFeesSubtotal)}
              </span>
            </div>
            <div className="my-2 border-t border-brand-sage/10 dark:border-brand-sage/20" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-brand-bark dark:text-brand-cream">
                Grand Total
              </span>
              <span className="text-lg font-bold text-brand-forest dark:text-brand-cream">
                {formatCurrency(order.grandTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {order.status === "draft" && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            isLoading={isCheckingOut}
            iconLeft={<CreditCard className="h-5 w-5" />}
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
