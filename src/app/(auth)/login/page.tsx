// =============================================================================
// Login Page — SSO with Google, Apple, and Email Magic Link
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
// Google SSO now uses native form POST — no fetch, no JS redirect
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");

  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const isSignup = searchParams.get("signup") === "true";

  const [csrfToken, setCsrfToken] = useState("");

  // Fetch CSRF token on mount so the form can submit directly
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading("email");
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setEmailError("Failed to send magic link. Please try again.");
        setIsLoading(null);
      } else {
        // Redirect to verification page
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
      setIsLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-sage/10 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-brand-sage/20 dark:bg-brand-bark/40">
      {/* Heading */}
      <h2 className="text-center text-xl font-bold text-brand-forest dark:text-brand-cream">
        {isSignup ? "Create your free account" : "Welcome back"}
      </h2>
      <p className="mt-1 text-center text-sm text-brand-sage">
        {isSignup
          ? "Start building your personalized hunting strategy"
          : "Sign in to access your hunting intelligence"}
      </p>

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error === "OAuthAccountNotLinked"
            ? "This email is already associated with another sign-in method."
            : "Something went wrong. Please try again."}
        </div>
      )}

      {/* SSO Buttons — native form POST, no JavaScript fetch */}
      <div className="mt-6 space-y-3">
        {/* Google */}
        <form method="POST" action="/api/auth/signin/google">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <button
            type="submit"
            disabled={!csrfToken}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-brand-sage/20 bg-white px-4 py-3 text-sm font-medium text-brand-bark shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-sage/30 dark:bg-brand-bark/30 dark:text-brand-cream dark:hover:bg-brand-bark/50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-sage/20" />
        <span className="text-xs font-medium text-brand-sage">or</span>
        <div className="h-px flex-1 bg-brand-sage/20" />
      </div>

      {/* Email Magic Link */}
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-[10px] border border-[#E0DDD5] bg-white px-4 py-3 text-sm text-brand-bark placeholder:text-brand-sage/50 focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:border-brand-sage/30 dark:bg-brand-bark/20 dark:text-brand-cream dark:placeholder:text-brand-sage/40 dark:focus:border-brand-sage dark:focus:ring-brand-sage/20"
          />
          {emailError && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {emailError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-cta px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading === "email" ? (
            <LoadingSpinner className="text-white" />
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          )}
          Send Magic Link
        </button>
      </form>

      {/* Toggle sign-in / sign-up */}
      <p className="mt-6 text-center text-sm text-brand-sage">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-forest underline-offset-2 hover:underline dark:text-brand-cream"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            {`New to ${process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic"}?`}{" "}
            <Link
              href="/signup"
              className="font-medium text-brand-forest underline-offset-2 hover:underline dark:text-brand-cream"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      {/* Legal */}
      <p className="mt-4 text-center text-xs leading-relaxed text-brand-sage/70">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-brand-sage">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-brand-sage">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner className="h-6 w-6 text-brand-forest" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
