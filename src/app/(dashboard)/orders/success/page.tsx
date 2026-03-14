"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, ArrowRight, Home, Crosshair } from "lucide-react";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";

interface OrderItem {
  id: string;
  stateCode: string;
  stateName?: string;
  speciesSlug: string;
  speciesName?: string;
  residency: string;
  huntType?: string;
  stateFee: number;
  serviceFee: number;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        // Invalidate cache to get fresh post-payment data
        invalidateCache(`/api/v1/concierge/orders/${orderId}`);
        invalidateCache("/api/v1/concierge/orders");

        const data = await fetchWithCache<{ order: Order }>(
          `/api/v1/concierge/orders/${orderId}`,
          { staleMs: 0 }
        );
        setOrder(data.order);
      } catch (err) {
        console.error("[checkout-success] Failed to fetch order:", err);
        setError("Could not load order details, but your payment was successful.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-12 text-center">
        <Skeleton variant="circle" className="mx-auto h-16 w-16" />
        <Skeleton variant="text" className="mx-auto h-8 w-64" />
        <Skeleton variant="text" className="mx-auto h-5 w-48" />
        <Skeleton variant="card" className="mx-auto h-40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      {/* Success icon and heading */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Payment Successful!
        </h1>
        <p className="mt-2 text-sm text-brand-sage">
          Your order has been confirmed and your applications are being processed.
        </p>
      </div>

      {/* Order confirmation */}
      {order && (
        <Card>
          <CardContent>
            <div className="space-y-4">
              {/* Order number and total */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-brand-sage">Order Number</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">
                    {order.metadata?.orderNumber
                      ? `#${order.metadata.orderNumber}`
                      : `#${order.id.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-sage">Total Paid</p>
                  <p className="text-lg font-bold text-brand-forest dark:text-brand-cream">
                    {formatCurrency(order.grandTotal)}
                  </p>
                </div>
              </div>

              {order.paidAt && (
                <p className="text-xs text-brand-sage">
                  Paid on {formatDate(order.paidAt)}
                </p>
              )}

              {/* Applications list */}
              <div className="border-t border-brand-sage/10 pt-4 dark:border-brand-sage/20">
                <h3 className="mb-3 text-sm font-semibold text-brand-bark dark:text-brand-cream">
                  Applications to be submitted
                </h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-brand-sage/10 p-3 dark:border-brand-sage/20"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-forest/10 dark:bg-brand-sage/20">
                        <Crosshair className="h-4 w-4 text-brand-forest dark:text-brand-cream" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-bark dark:text-brand-cream truncate">
                          {item.stateName || item.stateCode} &mdash;{" "}
                          {item.speciesName || item.speciesSlug}
                        </p>
                        <p className="text-xs text-brand-sage">
                          {item.residency === "resident" ? "Resident" : "Non-Resident"}
                          {item.huntType
                            ? ` / ${item.huntType.charAt(0).toUpperCase() + item.huntType.slice(1)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error note */}
      {error && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {order && (
          <Button
            variant="primary"
            iconRight={<ArrowRight className="h-4 w-4" />}
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            View Order Details
          </Button>
        )}
        <Button
          variant="outline"
          iconLeft={<Home className="h-4 w-4" />}
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl space-y-6 py-12 text-center">
          <Skeleton variant="circle" className="mx-auto h-16 w-16" />
          <Skeleton variant="text" className="mx-auto h-8 w-64" />
          <Skeleton variant="text" className="mx-auto h-5 w-48" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
