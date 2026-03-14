import type { Metadata } from "next";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description:
    "HuntLogic is an AI-powered hunting intelligence platform helping hunters make smarter decisions with draw odds, playbooks, and personalized recommendations.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-brand-forest dark:text-brand-cream">
        About HuntLogic
      </h1>

      <section className="mt-10 space-y-4 text-brand-bark/90 dark:text-brand-cream/80">
        <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">
          Our Mission
        </h2>
        <p>
          HuntLogic exists to level the playing field for western big-game
          hunters. We combine decades of draw data, harvest statistics, and
          season information with AI-driven analysis so every hunter — from
          first-timers to lifelong point holders — can make confident,
          data-backed decisions.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-brand-bark/90 dark:text-brand-cream/80">
        <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">
          What We Do
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Draw Odds Analysis</strong> — Historical draw data across
            every western state, broken down by unit, species, weapon type, and
            residency.
          </li>
          <li>
            <strong>Strategic Playbooks</strong> — Multi-year application
            strategies tailored to your point balances, preferences, and goals.
          </li>
          <li>
            <strong>Personalized Recommendations</strong> — AI-generated hunt
            suggestions that factor in your experience, fitness, budget, and
            timeline.
          </li>
          <li>
            <strong>Deadline Tracking</strong> — Never miss an application
            window, point purchase, or result release again.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4 text-brand-bark/90 dark:text-brand-cream/80">
        <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">
          Our Vision
        </h2>
        <p>
          We believe the best hunts start with the best information. Our team is
          building the definitive intelligence layer for North American hunting
          — one that respects wildlife management, supports conservation, and
          helps hunters spend less time guessing and more time in the field.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-brand-bark/90 dark:text-brand-cream/80">
        <h2 className="text-2xl font-semibold text-brand-forest dark:text-brand-gold">
          Contact Us
        </h2>
        <p>
          Questions, feedback, or partnership inquiries? Reach us at{" "}
          <a
            href={`mailto:${config.app.supportEmail}`}
            className="font-medium text-brand-sky underline underline-offset-2 hover:text-brand-sky/80"
          >
            {config.app.supportEmail}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
