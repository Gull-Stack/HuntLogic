"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Package,
  Dumbbell,
  Binoculars,
  Car,
  FileCheck,
} from "lucide-react";

interface PrepItem {
  id: string;
  label: string;
  category: string;
  required: boolean;
  notes?: string;
}

interface PrepSection {
  id: string;
  title: string;
  type: string;
  items: PrepItem[];
}

interface PrepPlan {
  recommendation: {
    id: string;
    stateCode: string;
    stateName: string;
    speciesSlug: string;
    speciesName: string;
    unitCode?: string;
  };
  sections: PrepSection[];
  totalItems: number;
}

interface ScoutingPlanProps {
  recommendationId: string;
}

const sectionIcons: Record<string, typeof Package> = {
  gear: Package,
  physical: Dumbbell,
  scouting: Binoculars,
  travel: Car,
  licenses: FileCheck,
};

export function ScoutingPlan({ recommendationId }: ScoutingPlanProps) {
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set()
  );

  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/scouting?recommendationId=${recommendationId}`
      );
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        // Expand first section by default
        if (data.sections?.length > 0) {
          setExpandedSections(new Set([data.sections[0].id]));
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [recommendationId]);

  // Load persisted completions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(
      `scouting_${recommendationId}`
    );
    if (stored) {
      setCompletedItems(new Set(JSON.parse(stored)));
    }
  }, [recommendationId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleItem = async (itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      // Persist to localStorage
      localStorage.setItem(
        `scouting_${recommendationId}`,
        JSON.stringify(Array.from(next))
      );
      return next;
    });

    // Also log to user_actions
    try {
      await fetch("/api/v1/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "scouting_check",
          metadata: { itemId, recommendationId },
        }),
      });
    } catch {
      // Silent fail
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20"
          />
        ))}
      </div>
    );
  }

  if (!plan) {
    return (
      <p className="text-sm text-brand-sage">
        Unable to load prep plan.
      </p>
    );
  }

  const completedCount = completedItems.size;
  const progressPct =
    plan.totalItems > 0
      ? Math.round((completedCount / plan.totalItems) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-xl border border-brand-sage/10 bg-white p-4 dark:border-brand-sage/20 dark:bg-brand-bark">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
            Prep Progress
          </span>
          <span className="text-sm text-brand-sage">
            {completedCount} of {plan.totalItems} items complete
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-sage/10 dark:bg-brand-sage/20">
          <div
            className="h-full rounded-full bg-brand-forest transition-all duration-500 motion-safe:transition-all dark:bg-brand-sage"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      {plan.sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const Icon = sectionIcons[section.type] ?? Package;
        const sectionCompleted = section.items.filter((i) =>
          completedItems.has(i.id)
        ).length;

        return (
          <div
            key={section.id}
            className="rounded-xl border border-brand-sage/10 bg-white shadow-sm dark:border-brand-sage/20 dark:bg-brand-bark"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-brand-forest dark:text-brand-sage" />
                <span className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                  {section.title}
                </span>
                <span className="rounded-full bg-brand-sage/10 px-2 py-0.5 text-xs text-brand-sage dark:bg-brand-sage/20">
                  {sectionCompleted}/{section.items.length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-brand-sage" />
              ) : (
                <ChevronDown className="h-4 w-4 text-brand-sage" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-brand-sage/10 px-4 py-2 dark:border-brand-sage/20">
                {section.items.map((item) => {
                  const isChecked = completedItems.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="flex min-h-[44px] w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-brand-sage/5"
                    >
                      {isChecked ? (
                        <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-brand-forest dark:text-brand-sage" />
                      ) : (
                        <Square className="mt-0.5 h-5 w-5 shrink-0 text-brand-sage/40" />
                      )}
                      <div>
                        <span
                          className={cn(
                            "text-sm",
                            isChecked
                              ? "text-brand-sage line-through"
                              : "text-brand-bark dark:text-brand-cream"
                          )}
                        >
                          {item.label}
                          {item.required && (
                            <span className="ml-1 text-xs text-brand-sunset">
                              *
                            </span>
                          )}
                        </span>
                        {item.notes && (
                          <p className="mt-0.5 text-xs text-brand-sage">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
