import Link from "next/link";
import {
  DEFAULT_PRICING,
  formatPrice,
  type PricingTier,
} from "@/lib/config/pricing";

// Map PricingTier config to the shape used by this page's template.
// Descriptions and hrefs are page-level presentation concerns.
const tierMeta: Record<string, { description: string; href: string }> = {
  scout: {
    description: "Get started exploring hunting opportunities across the West.",
    href: "/auth/register",
  },
  hunter: {
    description:
      "AI-powered tools to maximize your draw odds and plan smarter.",
    href: "/auth/register?plan=hunter",
  },
  outfitter: {
    description:
      "Everything in Hunter, plus tools for groups and professionals.",
    href: "/auth/register?plan=outfitter",
  },
};

function buildTiers(pricing: PricingTier[]) {
  return pricing.map((t) => ({
    name: t.name,
    price: formatPrice(t.monthlyPrice),
    period: t.monthlyPrice > 0 ? "/mo" : "",
    description: tierMeta[t.slug]?.description ?? "",
    cta: t.ctaLabel,
    href: tierMeta[t.slug]?.href ?? "/auth/register",
    featured: t.highlighted,
    features: t.features,
  }));
}

const tiers = buildTiers(DEFAULT_PRICING);

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade or downgrade whenever you want. If you upgrade mid-cycle, you'll receive a prorated credit. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "Is there a free trial for Hunter?",
    a: "Absolutely. Every new Hunter subscription starts with a 14-day free trial — no credit card required. You get full access to all Hunter features during the trial.",
  },
  {
    q: "What states and species do you cover?",
    a: "HuntLogic currently covers draw data for all western big game states including Colorado, Wyoming, Montana, Arizona, Nevada, New Mexico, Utah, Oregon, and Idaho — with more being added regularly.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Annual plans save you 20% compared to monthly billing. You can switch to annual billing at any time from your account settings.",
  },
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-5 w-5 shrink-0 text-success"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen px-[var(--spacing-page-x)] py-20">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-forest md:text-4xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-brand-sage">
          Choose the plan that fits your hunting ambitions. Start free and
          upgrade when you&apos;re ready for AI-powered intelligence.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`card card-interactive relative flex flex-col ${
              tier.featured
                ? "border-2 border-brand-orange shadow-md md:-mt-4 md:mb-[-1rem] md:py-10"
                : ""
            }`}
          >
            {tier.featured && (
              <span className="bg-gradient-cta absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Most Popular
              </span>
            )}

            <h3 className="text-xl font-bold text-brand-forest">
              {tier.name}
            </h3>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-brand-bark">
                {tier.price}
              </span>
              {tier.period && (
                <span className="text-sm text-brand-sage">{tier.period}</span>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-brand-sage">
              {tier.description}
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckIcon />
                  <span className="text-brand-bark">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={`mt-8 block rounded-lg py-3 text-center font-semibold transition ${
                tier.featured
                  ? "bg-gradient-cta text-white shadow-sm hover:opacity-90"
                  : "border border-brand-sage text-brand-forest hover:bg-brand-sage/10"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-center text-2xl font-bold text-brand-forest">
          Frequently Asked Questions
        </h2>

        <dl className="mt-10 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="card">
              <dt className="font-semibold text-brand-forest">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-brand-sage">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto mt-20 max-w-2xl text-center">
        <h3 className="text-xl font-bold text-brand-forest">
          Ready to hunt smarter?
        </h3>
        <p className="mt-2 text-brand-sage">
          Join thousands of hunters who trust HuntLogic to plan their next
          adventure.
        </p>
        <Link
          href="/auth/register"
          className="bg-gradient-cta mt-6 inline-block rounded-lg px-8 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Get Started for Free
        </Link>
      </div>
    </div>
  );
}
