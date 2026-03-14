"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { XCircle, ShoppingCart, Mail } from "lucide-react";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@huntlogic.com";

export default function CheckoutCancelledPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      {/* Cancelled icon and heading */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <XCircle className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Payment Cancelled
        </h1>
        <p className="mt-2 text-sm text-brand-sage">
          Your payment was cancelled. No charges were made. Your cart items have been saved.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="primary"
          iconLeft={<ShoppingCart className="h-4 w-4" />}
          onClick={() => router.push("/orders/cart")}
        >
          Return to Cart
        </Button>
      </div>

      {/* Help section */}
      <div className="rounded-xl border border-brand-sage/10 bg-white p-6 text-center dark:border-brand-sage/20 dark:bg-brand-bark">
        <Mail className="mx-auto mb-2 h-5 w-5 text-brand-sage" />
        <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">
          Need Help?
        </p>
        <p className="mt-1 text-sm text-brand-sage">
          If you experienced an issue during checkout, contact us at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-brand-forest underline hover:text-brand-forestLight dark:text-brand-cream"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  );
}
