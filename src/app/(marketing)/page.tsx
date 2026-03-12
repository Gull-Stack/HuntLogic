import Link from "next/link";
import {
  Target,
  TrendingUp,
  CalendarDays,
  MapPin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  BookOpen,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Tell us your goals",
    description:
      "Answer a few questions about your target species, states, budget, and hunting style. Takes about 3 minutes.",
    icon: Target,
  },
  {
    number: "02",
    title: "Get your playbook",
    description:
      "Our AI analyzes draw odds, point creep, success rates, and costs to build your multi-year strategy.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "Never miss a deadline",
    description:
      "Get alerts for application deadlines, draw results, and point purchase windows across all your states.",
    icon: CalendarDays,
  },
];

const features = [
  {
    title: "Smart Recommendations",
    description:
      "AI-powered hunt recommendations based on your profile, draw odds, success rates, and budget. Updated as conditions change.",
    icon: Sparkles,
    color: "bg-brand-sunset/10 text-brand-sunset",
  },
  {
    title: "Point Strategy",
    description:
      "Know exactly where to invest your preference points. Our forecasting engine projects point creep and tells you when to apply vs. build.",
    icon: TrendingUp,
    color: "bg-brand-sky/10 text-brand-sky",
  },
  {
    title: "Deadline Manager",
    description:
      "Never miss an application window again. Calendar integration with reminders for every state and species you track.",
    icon: CalendarDays,
    color: "bg-success/10 text-green-700",
  },
  {
    title: "National Coverage",
    description:
      "Draw data, harvest stats, and regulations for every western big game state. Colorado, Wyoming, Montana, Arizona, and more.",
    icon: MapPin,
    color: "bg-brand-earth/10 text-brand-earth",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-forest">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-brand-sage/10 bg-brand-cream/90 backdrop-blur-lg dark:bg-brand-forest/90 dark:border-brand-sage/20">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-brand-forest dark:text-brand-cream" />
            <span className="text-lg font-bold text-brand-forest dark:text-brand-cream">
              HuntLogic
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-brand-bark transition-colors hover:text-brand-forest sm:block dark:text-brand-cream/70 dark:hover:text-brand-cream"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-xl bg-brand-forest px-4 py-2 text-sm font-semibold text-brand-cream transition-colors hover:bg-brand-sage min-h-[40px] flex items-center dark:bg-brand-sage dark:hover:bg-brand-forest"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-pattern px-4 pb-16 pt-16 text-center md:px-6 md:pt-24 md:pb-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-brand-bark md:text-5xl lg:text-6xl dark:text-brand-cream">
            Never Miss a{" "}
            <span className="text-gradient">Hunt Again</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-sage md:text-lg">
            Your AI concierge for western big game. Get personalized draw
            strategies, deadline alerts, and data-driven recommendations —
            so you spend less time planning and more time hunting.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/onboarding"
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-forest px-6 py-3 text-base font-semibold text-brand-cream transition-all hover:bg-brand-sage active:scale-[0.98] dark:bg-brand-sage dark:hover:bg-brand-forest"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="flex min-h-[48px] items-center rounded-xl border border-brand-sage/30 px-6 py-3 text-base font-semibold text-brand-bark transition-all hover:bg-brand-sage/5 dark:text-brand-cream dark:border-brand-sage/50"
            >
              See How It Works
            </Link>
          </div>

          {/* Social proof hint */}
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-brand-sage">
            <CheckCircle className="h-4 w-4 text-success" />
            <span>Free to start. No credit card required.</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 md:px-6 md:py-20" id="how-it-works">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-brand-bark md:text-3xl dark:text-brand-cream">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-brand-sage">
            Three steps to a smarter hunt strategy
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center md:text-left">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-forest/10 md:mx-0 dark:bg-brand-sage/20">
                    <Icon className="h-6 w-6 text-brand-forest dark:text-brand-sage" />
                  </div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-sage">
                    Step {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-brand-sage leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white/50 px-4 py-16 md:px-6 md:py-20 dark:bg-brand-bark/30" id="features">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-brand-bark md:text-3xl dark:text-brand-cream">
            Everything you need to hunt smarter
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-brand-sage">
            Data-driven intelligence for every phase of your hunt planning
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-brand-sage/10 bg-white p-6 transition-shadow hover:shadow-md dark:bg-brand-bark dark:border-brand-sage/20"
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-sage">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Placeholder */}
      <section className="px-4 py-16 md:px-6 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-brand-bark md:text-3xl dark:text-brand-cream">
            Trusted by western hunters
          </h2>
          <p className="mt-2 text-brand-sage">
            Join thousands of hunters making smarter decisions
          </p>

          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Active Hunters", value: "2,500+" },
              { label: "States Covered", value: "10" },
              { label: "Species Tracked", value: "15+" },
              { label: "Deadlines Managed", value: "50k+" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-brand-forest md:text-3xl dark:text-brand-sage">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-brand-sage">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="bg-white/50 px-4 py-16 md:px-6 md:py-20 dark:bg-brand-bark/30">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-brand-bark md:text-3xl dark:text-brand-cream">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-brand-sage">
            Start for free. Upgrade when you need more.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                name: "Scout",
                price: "Free",
                features: ["Basic recommendations", "3 states", "Deadline alerts"],
              },
              {
                name: "Hunter",
                price: "$9/mo",
                features: ["AI playbook", "All states", "Point strategy", "Priority support"],
                highlighted: true,
              },
              {
                name: "Outfitter",
                price: "$29/mo",
                features: ["Everything in Hunter", "Multi-hunter", "API access", "Custom reports"],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 text-left ${
                  plan.highlighted
                    ? "border-brand-forest bg-brand-forest/5 dark:border-brand-sage dark:bg-brand-sage/10"
                    : "border-brand-sage/10 bg-white dark:bg-brand-bark dark:border-brand-sage/20"
                }`}
              >
                <h3 className="font-semibold text-brand-bark dark:text-brand-cream">
                  {plan.name}
                </h3>
                <p className="mt-1 text-2xl font-bold text-brand-bark dark:text-brand-cream">
                  {plan.price}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-brand-sage">
                      <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 text-center md:px-6 md:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-brand-bark md:text-4xl dark:text-brand-cream">
            Start Planning Smarter
          </h2>
          <p className="mt-3 text-base text-brand-sage md:text-lg">
            Your next hunt deserves a strategy. Let AI help you find the best
            opportunities, manage your points, and never miss a deadline.
          </p>
          <div className="mt-8">
            <Link
              href="/onboarding"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-brand-forest px-8 py-3 text-lg font-semibold text-brand-cream transition-all hover:bg-brand-sage active:scale-[0.98] dark:bg-brand-sage dark:hover:bg-brand-forest"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-sage/10 px-4 py-8 md:px-6 dark:border-brand-sage/20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-sage" />
            <span className="text-sm font-semibold text-brand-sage">
              HuntLogic Concierge
            </span>
          </div>
          <div className="flex gap-6 text-sm text-brand-sage">
            <Link href="/privacy" className="hover:text-brand-bark transition-colors dark:hover:text-brand-cream">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-brand-bark transition-colors dark:hover:text-brand-cream">
              Terms
            </Link>
            <Link href="/support" className="hover:text-brand-bark transition-colors dark:hover:text-brand-cream">
              Support
            </Link>
          </div>
          <p className="text-xs text-brand-sage/60">
            &copy; {new Date().getFullYear()} HuntLogic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
