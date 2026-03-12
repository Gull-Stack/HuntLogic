"use client";

import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  progress: number; // 0-100
  className?: string;
}

export function ProgressIndicator({ progress, className }: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const barColor =
    clampedProgress >= 60
      ? "bg-success"
      : clampedProgress >= 30
        ? "bg-warning"
        : "bg-brand-sage/40";

  const isPulse = clampedProgress >= 60;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
          Strategy Readiness
        </span>
        <span className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
          {Math.round(clampedProgress)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-sage/10 dark:bg-brand-sage/20">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            barColor,
            isPulse && "animate-pulse"
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
