"use client";

import { useState, useEffect } from "react";
import { cn, daysUntil, formatCountdown } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CalendarDays,
  List,
  Grid3x3,
  Download,
  FileText,
  Award,
  Clock,
} from "lucide-react";

interface CalendarDeadline {
  id: string;
  date: string;
  state: string;
  stateCode: string;
  title: string;
  type: "application" | "point_purchase" | "results" | "season";
  status: "upcoming" | "passed" | "today";
}

const typeIcons: Record<string, typeof FileText> = {
  application: FileText,
  point_purchase: Award,
  results: Clock,
  season: CalendarDays,
};

const typeLabels: Record<string, string> = {
  application: "Application",
  point_purchase: "Points",
  results: "Results",
  season: "Season",
};

type ViewMode = "list" | "month";
type FilterType = "all" | "application" | "point_purchase" | "results" | "season";

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FilterType>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchDeadlines() {
      try {
        const res = await fetch("/api/v1/deadlines?upcoming=true");
        if (res.ok) {
          const data = await res.json();
          setDeadlines(data.deadlines || []);
        }
      } catch (err) {
        console.error("[calendar] Failed to fetch deadlines:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeadlines();
  }, []);

  const filteredDeadlines = deadlines
    .filter((d) => filter === "all" || d.type === filter)
    .filter((d) => stateFilter === "all" || d.stateCode === stateFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group by month
  const groupedByMonth = new Map<string, CalendarDeadline[]>();
  for (const d of filteredDeadlines) {
    const monthKey = new Date(d.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const group = groupedByMonth.get(monthKey) || [];
    group.push(d);
    groupedByMonth.set(monthKey, group);
  }

  // Get unique states for filter
  const uniqueStates = [...new Set(deadlines.map((d) => d.stateCode))].sort();

  const handleExportIcs = (deadline: CalendarDeadline) => {
    const start = new Date(deadline.date);
    const end = new Date(deadline.date);
    end.setDate(end.getDate() + 1);

    const formatIcsDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic"}//Concierge//EN`,
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${formatIcsDate(start).split("T")[0]}`,
      `DTEND;VALUE=DATE:${formatIcsDate(end).split("T")[0]}`,
      `SUMMARY:${deadline.title} - ${deadline.state}`,
      `DESCRIPTION:${deadline.type} deadline for ${deadline.state}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deadline.stateCode}-${deadline.type}-${deadline.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "application", label: "Applications" },
    { value: "point_purchase", label: "Points" },
    { value: "results", label: "Results" },
    { value: "season", label: "Seasons" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-32 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-56 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 w-full motion-safe:animate-pulse rounded-xl bg-brand-sage/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-brand-sage">
            Application deadlines, season dates, and reminders
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-lg border border-brand-sage/20 dark:border-brand-sage/30">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors",
              viewMode === "list"
                ? "bg-brand-forest text-white dark:bg-brand-sage"
                : "text-brand-sage hover:bg-brand-sage/10"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors",
              viewMode === "month"
                ? "bg-brand-forest text-white dark:bg-brand-sage"
                : "text-brand-sage hover:bg-brand-sage/10"
            )}
            aria-label="Month view"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
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

        {/* State filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setStateFilter("all")}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px]",
              stateFilter === "all"
                ? "bg-brand-earth text-white"
                : "bg-brand-earth/10 text-brand-earth hover:bg-brand-earth/20"
            )}
          >
            All States
          </button>
          {uniqueStates.map((code) => (
            <button
              key={code}
              onClick={() => setStateFilter(code)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[32px]",
                stateFilter === code
                  ? "bg-brand-earth text-white"
                  : "bg-brand-earth/10 text-brand-earth hover:bg-brand-earth/20"
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* List View */}
      {filteredDeadlines.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title="No deadlines found"
          description="Try adjusting your filters or check back later."
          actionLabel="Clear Filters"
          onAction={() => {
            setFilter("all");
            setStateFilter("all");
          }}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByMonth.entries()).map(([month, items]) => (
            <div key={month}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-sage">
                {month}
              </h3>
              <div className="space-y-2">
                {items.map((deadline) => {
                  const days = daysUntil(deadline.date);
                  const Icon = typeIcons[deadline.type] || CalendarDays;
                  const urgencyColor =
                    days < 0
                      ? "text-brand-sage"
                      : days < 7
                        ? "text-red-600 dark:text-red-400"
                        : days < 14
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-green-600 dark:text-green-400";

                  return (
                    <Card key={deadline.id} className="flex items-center gap-3">
                      {/* Date column */}
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-sage/5 dark:bg-brand-sage/10">
                        <span className="text-[10px] font-medium uppercase text-brand-sage">
                          {new Date(deadline.date).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-lg font-bold text-brand-bark dark:text-brand-cream leading-none">
                          {new Date(deadline.date).getDate()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="info" size="sm">{deadline.stateCode}</Badge>
                          <Icon className="h-3.5 w-3.5 text-brand-sage" />
                          <span className="text-xs text-brand-sage">
                            {typeLabels[deadline.type]}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                          {deadline.title}
                        </p>
                      </div>

                      {/* Countdown + ICS */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-xs font-semibold", urgencyColor)}>
                          {formatCountdown(deadline.date)}
                        </span>
                        <button
                          onClick={() => handleExportIcs(deadline)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage hover:bg-brand-sage/10 transition-colors"
                          aria-label="Add to calendar"
                          title="Download .ics"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
