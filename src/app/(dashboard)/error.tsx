"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HuntLogic:Dashboard] Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl">🗺️</div>

      <h2 className="mt-5 text-2xl font-bold text-brand-forest dark:text-brand-cream">
        Lost the Signal
      </h2>

      <p className="mt-3 max-w-sm text-sm text-brand-sage">
        Something went wrong loading this page. Try again, or head back
        to the dashboard home.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="bg-gradient-cta rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-brand-sage px-5 py-2.5 text-sm font-semibold text-brand-forest transition hover:bg-brand-sage/10 dark:text-brand-cream"
        >
          Dashboard Home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-brand-sage/50">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
