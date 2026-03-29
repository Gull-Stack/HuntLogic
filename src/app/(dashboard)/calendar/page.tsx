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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface CalendarDeadlineRaw {
  id: string;
  deadlineDate?: string;
  date?: string;
  stateName?: string;
  state?: string;
  stateCode: string;
  title: string;
  description?: string;
  deadlineType?: string;
  type?: string;
  status?: "upcoming" | "passed" | "today";
}

interface CalendarDeadline {
  id: string;
  date: string;
  state: string;
  stateCode: string;
  title: string;
  description?: string;
  type: "application" | "point_purchase" | "results" | "season";
  status: "upcoming" | "passed" | "today";
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Map every DB deadline_type value to one of the 4 UI categories */
function mapDeadlineType(raw: string | undefined): CalendarDeadline["type"] {
  switch (raw) {
    case "application_open":
    case "application_deadline":
    case "application":
    case "other":
      return "application";
    case "preference_point":
    case "point_purchase":
      return "point_purchase";
    case "draw_results":
    case "draw_result":
    case "results":
      return "results";
    case "season":
      return "season";
    default:
      return "application";
  }
}

function normalizeDeadline(raw: CalendarDeadlineRaw): CalendarDeadline {
  const date = raw.deadlineDate || raw.date || "";
  const days = date
    ? Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    : 0;
  return {
    id: raw.id,
    date,
    state: raw.stateName || raw.state || raw.stateCode,
    stateCode: raw.stateCode,
    title: raw.title,
    description: raw.description,
    type: mapDeadlineType(raw.deadlineType || raw.type),
    status: raw.status || (days < 0 ? "passed" : days === 0 ? "today" : "upcoming"),
  };
}

function parseOpenCloseDates(description?: string): string | null {
  if (!description) return null;
  const opensMatch = description.match(/opens\s+(\d{4}-\d{2}-\d{2})/i);
  const closesMatch = description.match(/closes\s+(\d{4}-\d{2}-\d{2})/i);
  if (!opensMatch?.[1] && !closesMatch?.[1]) return null;

  const fmt = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const parts: string[] = [];
  if (opensMatch?.[1]) parts.push(`Open ${fmt(opensMatch[1])}`);
  if (closesMatch?.[1]) parts.push(`Closes ${fmt(closesMatch[1])}`);
  return parts.join(" \u2013 ") || null;
}

function getCalendarCells(year: number, month: number): (number | null)[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

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

const dotColorMap: Record<string, string> = {
  application: "bg-amber-400",
  draw_result: "bg-blue-400",
  results: "bg-blue-400",
  season: "bg-green-400",
  point_purchase: "bg-purple-400",
  preference_point: "bg-purple-400",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "list" | "month";
type FilterType = "all" | "application" | "point_purchase" | "results" | "season";

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function CalendarPage() {
  const [deadlines, setDeadlines] = useState<CalendarDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FilterType>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  // Month-view state
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDeadlines() {
      try {
        const res = await fetch("/api/v1/deadlines?year=2026");
        if (res.ok) {
          const data = await res.json();
          const raw: CalendarDeadlineRaw[] = data.deadlines || [];
          setDeadlines(raw.map(normalizeDeadline));
        }
      } catch (err) {
        console.error("[calendar] Failed to fetch deadlines:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeadlines();
  }, []);

  /* ---- Derived data ---- */

  const filteredDeadlines = deadlines
    .filter((d) => filter === "all" || d.type === filter)
    .filter((d) => stateFilter === "all" || d.stateCode === stateFilter)
    .sort((a, b) => {
      // Upcoming/today first, passed last
      const aPass = a.status === "passed" ? 1 : 0;
      const bPass = b.status === "passed" ? 1 : 0;
      if (aPass !== bPass) return aPass - bPass;
      // Within each group, sort by date ascending (soonest first)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

  // Split into upcoming and passed for list view
  const upcomingDeadlines = filteredDeadlines.filter((d) => d.status !== "passed");
  const passedDeadlines = filteredDeadlines.filter((d) => d.status === "passed");

  // Group by month (list view)
  const groupByMonth = (items: CalendarDeadline[]) => {
    const grouped = new Map<string, CalendarDeadline[]>();
    for (const d of items) {
      const monthKey = new Date(d.date).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const group = grouped.get(monthKey) || [];
      group.push(d);
      grouped.set(monthKey, group);
    }
    return grouped;
  };

  const upcomingByMonth = groupByMonth(upcomingDeadlines);
  const passedByMonth = groupByMonth(passedDeadlines);

  // Index by ISO date (month view)
  const deadlinesByDate = new Map<string, CalendarDeadline[]>();
  for (const d of filteredDeadlines) {
    const group = deadlinesByDate.get(d.date) || [];
    group.push(d);
    deadlinesByDate.set(d.date, group);
  }

  const uniqueStates = [...new Set(deadlines.map((d) => d.stateCode))].sort();

  /* ---- Month navigation ---- */

  const goToPrevMonth = () => {
    setSelectedDay(null);
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setSelectedDay(null);
    const t = new Date();
    setCalendarYear(t.getFullYear());
    setCalendarMonth(t.getMonth());
  };

  /* ---- Calendar grid helpers ---- */

  const cells = getCalendarCells(calendarYear, calendarMonth);
  const todayDate = new Date();
  const isCurrentMonth =
    todayDate.getFullYear() === calendarYear &&
    todayDate.getMonth() === calendarMonth;
  const todayDay = todayDate.getDate();

  const monthLabel = new Date(calendarYear, calendarMonth).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const getDeadlinesForDay = (day: number): CalendarDeadline[] => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return deadlinesByDate.get(dateStr) ?? [];
  };

  const selectedDayDeadlines = selectedDay
    ? getDeadlinesForDay(selectedDay)
    : [];

  /* ---- ICS export ---- */

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

  /* ---- Filter config ---- */

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "application", label: "Applications" },
    { value: "point_purchase", label: "Points" },
    { value: "results", label: "Results" },
    { value: "season", label: "Seasons" },
  ];

  /* ---- Loading skeleton ---- */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-32 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-56 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 w-full motion-safe:animate-pulse rounded-xl bg-brand-sage/10"
          />
        ))}
      </div>
    );
  }

  /* ---- Render ---- */

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
                : "text-brand-sage hover:bg-brand-sage/10",
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
                : "text-brand-sage hover:bg-brand-sage/10",
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
                  : "bg-brand-sage/10 text-brand-sage hover:bg-brand-sage/20 dark:bg-brand-sage/20",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* State filter — dropdown (scales to many states) */}
        <div className="flex items-center gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className={cn(
              "h-9 rounded-lg border border-brand-sage/20 dark:border-brand-sage/30 bg-white dark:bg-brand-bark",
              "px-3 text-sm text-brand-bark dark:text-brand-cream",
              "focus:outline-none focus:ring-2 focus:ring-brand-forest/40 dark:focus:ring-brand-sage/40",
              "transition-colors cursor-pointer",
              stateFilter !== "all" && "border-brand-earth text-brand-earth font-medium",
            )}
            aria-label="Filter by state"
          >
            <option value="all">All States ({uniqueStates.length})</option>
            {uniqueStates.map((code) => {
              const stateNames: Record<string, string> = {
                AZ: "Arizona", CA: "California", CO: "Colorado",
                ID: "Idaho", KY: "Kentucky", ME: "Maine",
                MI: "Michigan", MN: "Minnesota", MT: "Montana",
                ND: "North Dakota", NH: "New Hampshire", NM: "New Mexico",
                NV: "Nevada", OR: "Oregon", PA: "Pennsylvania",
                SD: "South Dakota", UT: "Utah", VA: "Virginia",
                VT: "Vermont", WA: "Washington", WV: "West Virginia",
                WY: "Wyoming",
              };
              const label = stateNames[code] ? `${stateNames[code]} (${code})` : code;
              return (
                <option key={code} value={code}>
                  {label}
                </option>
              );
            })}
          </select>
          {stateFilter !== "all" && (
            <button
              onClick={() => setStateFilter("all")}
              className="text-xs text-brand-sage hover:text-brand-bark dark:hover:text-brand-cream transition-colors"
              aria-label="Clear state filter"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/*  LIST VIEW                                                         */}
      {/* ================================================================== */}
      {viewMode === "list" &&
        (filteredDeadlines.length === 0 ? (
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
            {/* Upcoming deadlines */}
            {Array.from(upcomingByMonth.entries()).map(([month, items]) => (
              <div key={month}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-sage">
                  {month}
                </h3>
                <div className="space-y-2">
                  {items.map((deadline) => {
                    const days = daysUntil(deadline.date);
                    const Icon = typeIcons[deadline.type] ?? CalendarDays;
                    const urgencyColor =
                      days < 7
                        ? "text-red-600 dark:text-red-400"
                        : days < 14
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-green-600 dark:text-green-400";
                    const openClose = parseOpenCloseDates(deadline.description);

                    return (
                      <Card key={deadline.id} className="flex items-center gap-3">
                        {/* Date column */}
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-sage/5 dark:bg-brand-sage/10">
                          <span className="text-[10px] font-medium uppercase text-brand-sage">
                            {new Date(deadline.date).toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold leading-none text-brand-bark dark:text-brand-cream">
                            {new Date(deadline.date).getDate()}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="info" size="sm">
                              {deadline.stateCode}
                            </Badge>
                            <Icon className="h-3.5 w-3.5 text-brand-sage" />
                            <span className="text-xs text-brand-sage">
                              {typeLabels[deadline.type] ?? deadline.type}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                            {deadline.title}
                          </p>
                          {openClose && (
                            <p className="truncate text-xs text-brand-sage/70">
                              {openClose}
                            </p>
                          )}
                        </div>

                        {/* Countdown + ICS */}
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={cn("text-xs font-semibold", urgencyColor)}>
                            {formatCountdown(deadline.date)}
                          </span>
                          <button
                            onClick={() => handleExportIcs(deadline)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-brand-sage/10"
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

            {/* Past deadlines separator + section */}
            {passedByMonth.size > 0 && (
              <>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-brand-sage/20" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-sage/60">
                    Past Deadlines
                  </span>
                  <div className="h-px flex-1 bg-brand-sage/20" />
                </div>

                {Array.from(passedByMonth.entries()).map(([month, items]) => (
                  <div key={month}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-sage/60">
                      {month}
                    </h3>
                    <div className="space-y-2">
                      {items.map((deadline) => {
                        const Icon = typeIcons[deadline.type] ?? CalendarDays;
                        const openClose = parseOpenCloseDates(deadline.description);

                        return (
                          <Card key={deadline.id} className="flex items-center gap-3 opacity-50">
                            {/* Date column */}
                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-sage/5 dark:bg-brand-sage/10">
                              <span className="text-[10px] font-medium uppercase text-brand-sage">
                                {new Date(deadline.date).toLocaleDateString("en-US", {
                                  month: "short",
                                })}
                              </span>
                              <span className="text-lg font-bold leading-none text-brand-bark dark:text-brand-cream">
                                {new Date(deadline.date).getDate()}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="info" size="sm">
                                  {deadline.stateCode}
                                </Badge>
                                <Icon className="h-3.5 w-3.5 text-brand-sage" />
                                <span className="text-xs text-brand-sage">
                                  {typeLabels[deadline.type] ?? deadline.type}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                                {deadline.title}
                              </p>
                              {openClose && (
                                <p className="truncate text-xs text-brand-sage/70">
                                  {openClose}
                                </p>
                              )}
                            </div>

                            {/* Countdown + ICS */}
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs font-semibold text-brand-sage">
                                {formatCountdown(deadline.date)}
                              </span>
                              <button
                                onClick={() => handleExportIcs(deadline)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-brand-sage/10"
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
              </>
            )}
          </div>
        ))}

      {/* ================================================================== */}
      {/*  MONTH VIEW                                                        */}
      {/* ================================================================== */}
      {viewMode === "month" && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-brand-sage/10"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
                {monthLabel}
              </h3>
              {!isCurrentMonth && (
                <button
                  onClick={goToToday}
                  className="rounded-full px-3 py-1 text-xs font-medium bg-brand-sage/10 text-brand-sage transition-colors hover:bg-brand-sage/20"
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={goToNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-brand-sage/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="overflow-hidden rounded-xl border border-brand-sage/20 dark:border-brand-sage/30">
            {/* Day-of-week header */}
            <div className="grid grid-cols-7 bg-brand-sage/5 dark:bg-brand-sage/10">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-brand-sage"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[3.5rem] border-t border-brand-sage/10 bg-brand-sage/[0.02] dark:bg-brand-sage/[0.03]"
                    />
                  );
                }

                const dayDeadlines = getDeadlinesForDay(day);
                const isToday = isCurrentMonth && day === todayDay;
                const isSelected = selectedDay === day;
                const hasDeadlines = dayDeadlines.length > 0;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() =>
                      setSelectedDay(
                        hasDeadlines ? (isSelected ? null : day) : null,
                      )
                    }
                    className={cn(
                      "min-h-[3.5rem] border-t border-brand-sage/10 p-1.5 text-left transition-colors",
                      hasDeadlines
                        ? "cursor-pointer hover:bg-brand-sage/5"
                        : "cursor-default",
                      isSelected && "bg-brand-forest/5 dark:bg-brand-sage/10",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday
                          ? "bg-brand-forest text-white"
                          : "text-brand-bark dark:text-brand-cream",
                      )}
                    >
                      {day}
                    </span>
                    {hasDeadlines && (
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {dayDeadlines.slice(0, 4).map((dl) => (
                          <span
                            key={dl.id}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              dotColorMap[dl.type] ?? "bg-gray-400",
                            )}
                          />
                        ))}
                        {dayDeadlines.length > 4 && (
                          <span className="text-[9px] leading-none text-brand-sage">
                            +{dayDeadlines.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dot legend */}
          <div className="flex flex-wrap gap-3 text-xs text-brand-sage">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Application
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> Results
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Season
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-400" /> Points
            </span>
          </div>

          {/* Selected-day detail panel */}
          {selectedDay !== null && selectedDayDeadlines.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                {new Date(calendarYear, calendarMonth, selectedDay).toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric" },
                )}
              </h4>
              {selectedDayDeadlines.map((deadline) => {
                const Icon = typeIcons[deadline.type] ?? CalendarDays;
                return (
                  <Card key={deadline.id} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full",
                        dotColorMap[deadline.type] ?? "bg-gray-400",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="sm">
                          {deadline.stateCode}
                        </Badge>
                        <Icon className="h-3.5 w-3.5 text-brand-sage" />
                        <span className="text-xs text-brand-sage">
                          {typeLabels[deadline.type] ?? deadline.type}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                        {deadline.title}
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportIcs(deadline)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-brand-sage/10"
                      aria-label="Add to calendar"
                      title="Download .ics"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
