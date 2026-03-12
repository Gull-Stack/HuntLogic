"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  Award,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ActionPriority } from "@/lib/types";

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  type: "deadline" | "application" | "points" | "general";
  priority: ActionPriority;
  dueDate?: string;
  actionUrl?: string;
  completed?: boolean;
}

interface ActionFeedProps {
  actions: ActionItem[];
  onComplete?: (id: string) => void;
}

const typeIcons: Record<string, typeof CalendarDays> = {
  deadline: CalendarDays,
  application: FileText,
  points: Award,
  general: AlertCircle,
};

const priorityVariants: Record<ActionPriority, { variant: "danger" | "warning" | "info" | "default"; label: string }> = {
  urgent: { variant: "danger", label: "Critical" },
  high: { variant: "warning", label: "High" },
  medium: { variant: "info", label: "Medium" },
  low: { variant: "default", label: "Low" },
};

type FilterType = "all" | "deadline" | "application" | "points";

export function ActionFeed({ actions, onComplete }: ActionFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const filteredActions = actions.filter((action) => {
    if (completedIds.has(action.id)) return false;
    if (filter === "all") return true;
    return action.type === filter;
  });

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "deadline", label: "Deadlines" },
    { value: "application", label: "Applications" },
    { value: "points", label: "Points" },
  ];

  const handleComplete = (id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    onComplete?.(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
          Action Items
        </h2>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[36px]",
              filter === f.value
                ? "bg-brand-forest text-brand-cream dark:bg-brand-sage"
                : "bg-brand-sage/10 text-brand-sage hover:bg-brand-sage/20 dark:bg-brand-sage/20"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Action list */}
      {filteredActions.length === 0 ? (
        <EmptyState
          icon={<Check className="h-8 w-8" />}
          title="No pending actions"
          description="You're all caught up. Check back later for new action items."
        />
      ) : (
        <div className="space-y-2">
          {filteredActions.map((action) => {
            const Icon = typeIcons[action.type] || AlertCircle;
            const priority = priorityVariants[action.priority];
            const isExpanded = expandedId === action.id;

            return (
              <div
                key={action.id}
                className="rounded-xl border border-brand-sage/10 bg-white transition-all dark:bg-brand-bark dark:border-brand-sage/20"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : action.id)
                  }
                  className="flex min-h-[56px] w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-sage/10 dark:bg-brand-sage/20">
                    <Icon className="h-5 w-5 text-brand-sage" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                      {action.title}
                    </p>
                    {action.dueDate && (
                      <p className="text-xs text-brand-sage">
                        Due: {new Date(action.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <Badge variant={priority.variant} size="sm">
                    {priority.label}
                  </Badge>

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-brand-sage" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-brand-sage" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-brand-sage/10 px-4 pb-4 pt-3 animate-slide-down dark:border-brand-sage/20">
                    {action.description && (
                      <p className="text-sm text-brand-sage mb-3">
                        {action.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleComplete(action.id)}
                      >
                        Mark Complete
                      </Button>
                      {action.actionUrl && (
                        <a href={action.actionUrl}>
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
