"use client";

import { useState, useEffect } from "react";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { StrategySnapshot } from "@/components/dashboard/StrategySnapshot";
import { DeadlineWidget } from "@/components/dashboard/DeadlineWidget";
import { ActionFeed } from "@/components/dashboard/ActionFeed";
import { SkeletonList } from "@/components/ui/Skeleton";

// Mock data for demo/development
const mockAlerts = [
  {
    id: "1",
    type: "urgent" as const,
    message: "Colorado elk application deadline in 5 days",
    ctaLabel: "Apply Now",
    ctaHref: "/calendar",
  },
  {
    id: "2",
    type: "info" as const,
    message: "New draw results available for Wyoming",
    ctaLabel: "View Results",
    ctaHref: "/recommendations",
  },
];

const mockDeadlines = [
  {
    id: "d1",
    state: "Colorado",
    stateCode: "CO",
    title: "Primary elk application",
    date: "2026-04-01",
    type: "Application",
  },
  {
    id: "d2",
    state: "Wyoming",
    stateCode: "WY",
    title: "Moose/sheep/goat application",
    date: "2026-04-15",
    type: "Application",
  },
  {
    id: "d3",
    state: "Montana",
    stateCode: "MT",
    title: "General deer/elk combo",
    date: "2026-05-01",
    type: "Application",
  },
  {
    id: "d4",
    state: "Arizona",
    stateCode: "AZ",
    title: "Fall hunt application",
    date: "2026-06-10",
    type: "Application",
  },
];

const mockActions = [
  {
    id: "a1",
    title: "Submit Colorado elk application",
    description:
      "Apply for Unit 61 elk with your 3 preference points. First choice rifle, second choice archery.",
    type: "application" as const,
    priority: "urgent" as const,
    dueDate: "2026-04-01",
    actionUrl: "https://cpw.state.co.us",
  },
  {
    id: "a2",
    title: "Purchase Wyoming preference point",
    description:
      "Buy your annual elk preference point to maintain your position in the draw.",
    type: "points" as const,
    priority: "high" as const,
    dueDate: "2026-04-30",
  },
  {
    id: "a3",
    title: "Review Montana draw results",
    description:
      "Montana general deer/elk results are out. Check your status.",
    type: "general" as const,
    priority: "medium" as const,
  },
  {
    id: "a4",
    title: "Update preference point totals",
    description:
      "Your point balances may have changed after this year's draws. Update them for accurate predictions.",
    type: "points" as const,
    priority: "low" as const,
  },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName] = useState("Hunter");

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-32 animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          {greeting}, {userName}
        </h1>
        <p className="mt-0.5 text-sm text-brand-sage">{dateStr}</p>
      </div>

      {/* Alerts */}
      <AlertBanner alerts={mockAlerts} />

      {/* Strategy + Deadlines grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StrategySnapshot
          statesActive={4}
          speciesTracked={3}
          pointsBuilding={12}
          nextDeadline="2026-04-01"
          playbookExists={true}
          playbookStale={false}
          lastUpdated="2026-03-01"
        />
        <DeadlineWidget deadlines={mockDeadlines} />
      </div>

      {/* Action Feed */}
      <ActionFeed actions={mockActions} />
    </div>
  );
}
