"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Crosshair, Target, Award, CalendarClock, RefreshCw, Sparkles } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface StrategySnapshotProps {
  statesActive?: number;
  speciesTracked?: number;
  pointsBuilding?: number;
  nextDeadline?: string | null;
  playbookExists?: boolean;
  playbookStale?: boolean;
  lastUpdated?: string | null;
}

export function StrategySnapshot({
  statesActive = 0,
  speciesTracked = 0,
  pointsBuilding = 0,
  nextDeadline,
  playbookExists = false,
  playbookStale = false,
  lastUpdated,
}: StrategySnapshotProps) {
  const stats = [
    { label: "States Active", value: statesActive, icon: Target, color: "text-brand-forest dark:text-brand-sage" },
    { label: "Species Tracked", value: speciesTracked, icon: Crosshair, color: "text-brand-sky" },
    { label: "Points Building", value: pointsBuilding, icon: Award, color: "text-brand-sunset" },
    {
      label: "Next Deadline",
      value: nextDeadline ? formatDate(nextDeadline) : "None",
      icon: CalendarClock,
      color: "text-brand-earth",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
            Your Hunt Strategy
          </h2>
          {lastUpdated && (
            <span className="text-xs text-brand-sage">
              Updated {formatDate(lastUpdated)}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl bg-brand-sage/5 p-3 dark:bg-brand-sage/10"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", stat.color)} />
                  <span className="text-xs text-brand-sage">{stat.label}</span>
                </div>
                <p className="mt-1 text-lg font-bold text-brand-bark dark:text-brand-cream">
                  {typeof stat.value === "number" ? stat.value : stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter>
        {!playbookExists ? (
          <Link href="/playbook" className="w-full">
            <Button fullWidth iconLeft={<Sparkles className="h-4 w-4" />}>
              Generate Strategy
            </Button>
          </Link>
        ) : playbookStale ? (
          <Link href="/playbook" className="w-full">
            <Button
              fullWidth
              variant="outline"
              iconLeft={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Strategy
            </Button>
          </Link>
        ) : (
          <Link href="/playbook" className="w-full">
            <Button fullWidth variant="ghost">
              View Full Playbook
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
