"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { RefreshCw, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RecommendationCard } from "./RecommendationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";
import type { PlaybookData, RecommendationOutput, BudgetAllocation } from "@/services/intelligence/types";

interface PlaybookViewProps {
  playbook: PlaybookData | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type TimelineTab = "near" | "mid" | "long" | "points";

const tabLabels: Record<TimelineTab, string> = {
  near: "This Year",
  mid: "2-4 Years",
  long: "5+ Years",
  points: "Point Strategy",
};

export function PlaybookView({ playbook, onRefresh, isRefreshing }: PlaybookViewProps) {
  const [activeTab, setActiveTab] = useState<TimelineTab>("near");
  const [showFullSummary, setShowFullSummary] = useState(false);

  if (!playbook) {
    return (
      <EmptyState
        icon={<BookOpen className="h-8 w-8" />}
        title="No Playbook Yet"
        description="Generate your personalized multi-year hunt strategy based on your profile."
        actionLabel={isRefreshing ? "Generating..." : "Generate Playbook"}
        onAction={onRefresh}
      />
    );
  }

  const tabRecommendations: Record<TimelineTab, RecommendationOutput[]> = {
    near: playbook.nearTerm,
    mid: playbook.midTerm,
    long: playbook.longTerm,
    points: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-brand-bark dark:text-brand-cream">
              Your Playbook
            </h2>
            <Badge variant="outline" size="sm">
              v{playbook.version}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-brand-sage">
            Updated {formatDate(playbook.generatedAt)}
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl border border-brand-sage/10 bg-white p-4 dark:bg-brand-bark dark:border-brand-sage/20">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-sage">
          Executive Summary
        </h3>
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed text-brand-bark dark:text-brand-cream",
            !showFullSummary && "line-clamp-3"
          )}
        >
          {playbook.executiveSummary}
        </p>
        {playbook.executiveSummary.length > 200 && (
          <button
            onClick={() => setShowFullSummary(!showFullSummary)}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-sage hover:text-brand-forest transition-colors"
          >
            {showFullSummary ? "Show less" : "Read more"}
            {showFullSummary ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {(Object.keys(tabLabels) as TimelineTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[44px]",
              activeTab === tab
                ? "bg-brand-forest text-brand-cream dark:bg-brand-sage"
                : "bg-brand-sage/10 text-brand-sage hover:bg-brand-sage/20 dark:bg-brand-sage/20"
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "points" ? (
        <PointStrategyView items={playbook.pointStrategy} />
      ) : (
        <div className="space-y-4">
          {tabRecommendations[activeTab].length === 0 ? (
            <div className="rounded-xl bg-brand-sage/5 p-6 text-center dark:bg-brand-sage/10">
              <p className="text-sm text-brand-sage">
                No recommendations for this timeline yet.
              </p>
            </div>
          ) : (
            tabRecommendations[activeTab].map((rec, idx) => (
              <div key={rec.id ?? idx} className="space-y-1">
                <RecommendationCard recommendation={rec} />
                {rec.hunt.stateCode && rec.hunt.speciesSlug && (
                  <Link
                    href={`/recommendations/units?state=${encodeURIComponent(rec.hunt.stateCode)}&species=${encodeURIComponent(rec.hunt.speciesSlug)}&motivation=${encodeURIComponent(rec.orientation === "opportunity" ? "meat" : rec.orientation === "experience" ? "balanced" : rec.orientation)}`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-brand-sage hover:text-brand-forest transition-colors"
                  >
                    See Units <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Budget allocation */}
      {playbook.budgetAllocation && (
        <BudgetAllocationView allocation={playbook.budgetAllocation} />
      )}

      {/* Refresh FAB */}
      {onRefresh && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 lg:right-12 z-50">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-forest text-white shadow-lg transition-all hover:bg-brand-sage active:scale-95 disabled:opacity-50"
            aria-label="Refresh playbook"
          >
            <RefreshCw className={cn("h-5 w-5", isRefreshing && "motion-safe:animate-spin")} />
          </button>
        </div>
      )}
    </div>
  );
}

// Point strategy sub-component
function PointStrategyView({
  items,
}: {
  items: PlaybookData["pointStrategy"];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-brand-sage/5 p-6 text-center dark:bg-brand-sage/10">
        <p className="text-sm text-brand-sage">No point strategy data yet.</p>
      </div>
    );
  }

  const recColors: Record<string, "success" | "info" | "warning" | "danger"> = {
    apply_now: "success",
    build_points: "info",
    hold: "warning",
    consider_exit: "danger",
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-brand-sage/10 bg-white p-4 dark:bg-brand-bark dark:border-brand-sage/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-brand-bark dark:text-brand-cream">
                {item.speciesName}
              </p>
              <p className="text-sm text-brand-sage">
                {item.stateName} ({item.stateCode}) — {item.currentPoints} pts (
                {item.pointType})
              </p>
            </div>
            <Badge variant={recColors[item.recommendation] || "default"} size="sm">
              {item.recommendation.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-brand-sage">{item.rationale}</p>
          {item.projectedYearsToTag && (
            <p className="mt-1 text-xs text-brand-sage">
              Projected years to tag: ~{item.projectedYearsToTag} | Annual cost: {formatCurrency(item.annualCost)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Budget allocation sub-component
function BudgetAllocationView({ allocation }: { allocation: BudgetAllocation }) {
  const total = allocation.totalBudget;
  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-brand-sage/10 bg-white p-4 dark:bg-brand-bark dark:border-brand-sage/20">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-sage mb-3">
        Budget Allocation
      </h3>

      {/* Horizontal stacked bar */}
      <div className="flex h-6 overflow-hidden rounded-full bg-brand-sage/10 dark:bg-brand-sage/20 mb-4">
        {allocation.allocations.map((item, idx) => {
          const widthPct = (item.amount / total) * 100;
          const colors = [
            "bg-brand-forest",
            "bg-brand-sage",
            "bg-brand-sky",
            "bg-brand-earth",
            "bg-brand-sunset",
          ];
          return (
            <div
              key={idx}
              className={cn("h-full", colors[idx % colors.length])}
              style={{ width: `${widthPct}%` }}
              title={`${item.category}: ${formatCurrency(item.amount)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {allocation.allocations.map((item, idx) => {
          const colors = [
            "bg-brand-forest",
            "bg-brand-sage",
            "bg-brand-sky",
            "bg-brand-earth",
            "bg-brand-sunset",
          ];
          return (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", colors[idx % colors.length])} />
                <span className="text-sm text-brand-sage">{item.category}</span>
              </div>
              <span className="text-sm font-medium text-brand-bark dark:text-brand-cream tabular-nums">
                {formatCurrency(item.amount)}
              </span>
            </div>
          );
        })}
        <div className="flex items-center justify-between border-t border-brand-sage/10 pt-2 dark:border-brand-sage/20">
          <span className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
            Total Budget
          </span>
          <span className="text-sm font-bold text-brand-bark dark:text-brand-cream tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
