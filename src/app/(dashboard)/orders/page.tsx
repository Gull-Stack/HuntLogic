"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ShoppingCart, Plus, ChevronRight, Package } from "lucide-react";
import { fetchWithCache } from "@/lib/api/cache";

interface OrderItem {
  id: string;
  stateCode: string;
  speciesSlug: string;
  residency: "resident" | "non_resident";
  huntType?: string;
  stateFee: number;
  serviceFee: number;
  status: string;
}

interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  grandTotal: number;
  createdAt: string;
  paidAt?: string;
  metadata?: {
    orderNumber?: string;
  };
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await fetchWithCache<{ orders: Order[] }>(
          "/api/v1/concierge/orders",
          { staleMs: 30_000 }
        );
        setOrders(data.orders || []);
      } catch (err) {
        console.error("[orders] Failed to fetch:", err);
        setError("Failed to load orders. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-56 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
            Orders
          </h1>
        </div>
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm font-medium text-brand-forest underline dark:text-brand-cream"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
            Orders
          </h1>
          <p className="mt-1 text-sm text-brand-sage">
            Track your application orders and submissions
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus className="h-4 w-4" />}
          onClick={() => router.push("/orders/cart")}
        >
          New Order
        </Button>
      </div>

      {/* Order List */}
      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="No orders yet"
          description="Start building your first application order. We'll handle the paperwork for you."
          actionLabel="Start New Order"
          actionHref="/orders/cart"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.draft;

            return (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full rounded-xl border border-brand-sage/10 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md dark:border-brand-sage/20 dark:bg-brand-bark motion-safe:hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-forest/10 dark:bg-brand-sage/20">
                      <Package className="h-5 w-5 text-brand-forest dark:text-brand-cream" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                        {order.metadata?.orderNumber
                          ? `Order #${order.metadata.orderNumber}`
                          : `Order`}
                      </h3>
                      <p className="text-xs text-brand-sage">
                        {formatDate(order.createdAt)} &middot;{" "}
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                        {formatCurrency(order.grandTotal)}
                      </p>
                      <Badge
                        variant={badge.variant}
                        size="sm"
                        className={badge.className}
                      >
                        {badge.label}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-brand-sage/50" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
