"use client";

import { cn } from "@/lib/utils";

interface DrawOddsChartProps {
  percentage: number;
  label?: string;
  trend?: { year: number; value: number }[];
  className?: string;
}

export function DrawOddsChart({
  percentage,
  label,
  trend,
  className,
}: DrawOddsChartProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const barColor =
    clampedPct > 50
      ? "bg-success"
      : clampedPct > 20
        ? "bg-warning"
        : "bg-danger";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <p className="mb-1 text-xs font-medium text-brand-sage">{label}</p>
      )}

      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 overflow-hidden rounded-full bg-brand-sage/10 dark:bg-brand-sage/20">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <span className="text-sm font-bold text-brand-bark dark:text-brand-cream tabular-nums">
          {Math.round(clampedPct)}%
        </span>
      </div>

      {/* Mini trend chart (SVG sparkline) */}
      {trend && trend.length > 1 && (
        <div className="mt-2">
          <MiniSparkline data={trend} />
        </div>
      )}
    </div>
  );
}

function MiniSparkline({ data }: { data: { year: number; value: number }[] }) {
  const width = 120;
  const height = 24;
  const padding = 2;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-6 w-full max-w-[120px]"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand-sage"
        />
      </svg>
      <span className="text-[10px] text-brand-sage whitespace-nowrap">
        {data.length}yr trend
      </span>
    </div>
  );
}
