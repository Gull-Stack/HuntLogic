import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-6 text-center dark:bg-brand-forest">
      <div className="text-8xl">🦌</div>

      <h1 className="mt-6 text-4xl font-bold text-brand-forest dark:text-brand-cream">
        Trail Went Cold
      </h1>

      <p className="mt-3 max-w-md text-brand-sage">
        Looks like the page you&apos;re tracking has moved on. Even the best
        hunters lose a trail sometimes — let&apos;s get you back to camp.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="bg-gradient-cta rounded-lg px-6 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-brand-sage px-6 py-3 font-semibold text-brand-forest transition hover:bg-brand-sage/10 dark:text-brand-cream"
        >
          Home
        </Link>
      </div>

      <p className="mt-12 text-sm text-brand-sage/60">
        Error 404 — Page not found
      </p>
    </div>
  );
}
