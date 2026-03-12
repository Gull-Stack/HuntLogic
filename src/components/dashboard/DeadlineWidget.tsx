"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { cn, daysUntil, formatCountdown } from "@/lib/utils";
import { CalendarDays, ChevronRight } from "lucide-react";

interface Deadline {
  id: string;
  state: string;
  stateCode: string;
  title: string;
  date: string;
  type: string;
}

interface DeadlineWidgetProps {
  deadlines: Deadline[];
  maxItems?: number;
}

export function DeadlineWidget({ deadlines, maxItems = 5 }: DeadlineWidgetProps) {
  const sortedDeadlines = [...deadlines]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand-earth" />
            <h2 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
              Upcoming Deadlines
            </h2>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-1 text-sm font-medium text-brand-sage hover:text-brand-forest transition-colors"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {sortedDeadlines.length === 0 ? (
          <p className="text-sm text-brand-sage py-4 text-center">
            No upcoming deadlines. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedDeadlines.map((deadline) => {
              const days = daysUntil(deadline.date);
              const urgencyColor =
                days < 3
                  ? "text-red-600 dark:text-red-400"
                  : days < 7
                    ? "text-red-500"
                    : days < 14
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-green-600 dark:text-green-400";

              const isUrgent = days < 3 && days >= 0;

              return (
                <div
                  key={deadline.id}
                  className="flex items-center gap-3 rounded-lg py-2"
                >
                  {/* State badge */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-sage/10 text-xs font-bold text-brand-sage dark:bg-brand-sage/20">
                    {deadline.stateCode}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-brand-sage">{deadline.type}</p>
                  </div>

                  {/* Countdown */}
                  <div className={cn("text-right shrink-0", urgencyColor)}>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isUrgent && "animate-pulse"
                      )}
                    >
                      {formatCountdown(deadline.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
