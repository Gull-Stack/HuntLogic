"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[HuntLogic] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-6 text-center dark:bg-brand-forest">
      <div className="text-7xl">🏕️</div>

      <h1 className="mt-6 text-3xl font-bold text-brand-forest dark:text-brand-cream">
        Something Went Wrong
      </h1>

      <p className="mt-3 max-w-md text-brand-sage">
        We hit an unexpected snag on the trail. Our team has been notified.
        You can try again or head back to the dashboard.
      </p>

      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="bg-gradient-cta rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-brand-sage px-6 py-3 font-semibold text-brand-forest transition hover:bg-brand-sage/10 dark:text-brand-cream"
        >
          Back to Dashboard
        </Link>
      </div>

      {error.digest && (
        <p className="mt-10 text-xs text-brand-sage/50">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
