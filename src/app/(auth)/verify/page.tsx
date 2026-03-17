// =============================================================================
// Magic Link Verification Page — Shown after email is submitted
// =============================================================================

"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    setError("");
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to resend. Please try again.");
      } else {
        setResent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsResending(false);
  };

  return (
    <div className="rounded-2xl border border-brand-sage/10 bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm dark:border-brand-sage/20 dark:bg-brand-bark/40">
      {/* Email icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-forest/10 dark:bg-brand-sage/10">
        <svg
          className="h-8 w-8 text-brand-forest dark:text-brand-sage"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-xl font-bold text-brand-forest dark:text-brand-cream">
        Check your email
      </h2>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-brand-sage">
        We sent a magic link to{" "}
        <span className="font-medium text-brand-bark dark:text-brand-cream">
          {email || "your email"}
        </span>
        . Click the link to sign in.
      </p>

      {/* Expiry notice */}
      <p className="mt-3 text-xs text-brand-sage/70">
        The link will expire in 24 hours.
      </p>

      {/* Error */}
      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button
          onClick={handleResend}
          disabled={isResending || resent}
          className="w-full rounded-xl border border-brand-sage/20 px-4 py-2.5 text-sm font-medium text-brand-forest transition-all hover:bg-brand-sage/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sage/30 dark:text-brand-cream dark:hover:bg-brand-sage/10"
        >
          {resent
            ? "Link resent! Check your inbox."
            : isResending
              ? "Resending..."
              : "Didn't receive it? Resend"}
        </button>

        {/* Back to login */}
        <Link
          href="/login"
          className="block w-full rounded-xl px-4 py-2.5 text-sm font-medium text-brand-sage transition-all hover:text-brand-forest dark:hover:text-brand-cream"
        >
          Use a different email
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-sage/20 border-t-brand-forest" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
