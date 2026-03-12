export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="bg-pattern px-[var(--spacing-page-x)] py-20 text-center">
        <h1 className="text-gradient text-4xl font-bold md:text-5xl lg:text-6xl">
          HuntLogic Concierge
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-sage">
          Your AI-powered hunting intelligence platform. Get personalized draw
          strategies, real-time deadline alerts, and data-driven recommendations
          for western big game hunting.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/signup"
            className="rounded-lg bg-brand-forest px-8 py-3 font-semibold text-brand-cream transition-colors hover:bg-brand-sage"
          >
            Get Started Free
          </a>
          <a
            href="/features"
            className="rounded-lg border border-brand-forest px-8 py-3 font-semibold text-brand-forest transition-colors hover:bg-brand-forest/5"
          >
            See Features
          </a>
        </div>
      </header>

      {/* Features Overview */}
      <section className="px-[var(--spacing-page-x)] py-[var(--spacing-section)]">
        <h2 className="text-center text-2xl font-bold text-brand-forest">
          Hunt smarter, not harder
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-brand-sage">
          Everything you need to maximize your western big game hunting success.
        </p>
      </section>
    </div>
  );
}
