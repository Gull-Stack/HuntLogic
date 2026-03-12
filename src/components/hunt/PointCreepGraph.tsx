"use client";

import { cn } from "@/lib/utils";

interface PointCreepGraphProps {
  historicalData: { year: number; points: number }[];
  projectedData?: { year: number; points: number }[];
  userPoints?: number;
  estimatedDrawYear?: number | null;
  className?: string;
}

export function PointCreepGraph({
  historicalData,
  projectedData = [],
  userPoints,
  estimatedDrawYear,
  className,
}: PointCreepGraphProps) {
  const allData = [...historicalData, ...projectedData];
  if (allData.length < 2) {
    return (
      <div className={cn("rounded-xl bg-brand-sage/5 p-4 text-center dark:bg-brand-sage/10", className)}>
        <p className="text-sm text-brand-sage">Not enough data for trend</p>
      </div>
    );
  }

  const width = 300;
  const height = 140;
  const padLeft = 32;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 24;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const allPoints = allData.map((d) => d.points);
  const allYears = allData.map((d) => d.year);
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  const minPts = 0;
  const maxPts = Math.max(...allPoints, userPoints ?? 0) + 2;
  const yearRange = maxYear - minYear || 1;
  const ptsRange = maxPts - minPts || 1;

  const toX = (year: number) => padLeft + ((year - minYear) / yearRange) * chartWidth;
  const toY = (pts: number) => padTop + chartHeight - ((pts - minPts) / ptsRange) * chartHeight;

  const historicalPath = historicalData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(d.year)} ${toY(d.points)}`)
    .join(" ");

  const projectedPath =
    projectedData.length > 0
      ? [
          `M ${toX(historicalData[historicalData.length - 1]?.year ?? minYear)} ${toY(historicalData[historicalData.length - 1]?.points ?? 0)}`,
          ...projectedData.map(
            (d) => `L ${toX(d.year)} ${toY(d.points)}`
          ),
        ].join(" ")
      : "";

  // Y-axis labels (pick 3-4 ticks)
  const yTicks = [0, Math.round(maxPts / 2), maxPts];
  // X-axis labels
  const xTicks = allYears.filter(
    (_, i) => i === 0 || i === allYears.length - 1 || i === Math.floor(allYears.length / 2)
  );

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={toY(tick)}
              y2={toY(tick)}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-brand-sage/20"
            />
            <text
              x={padLeft - 4}
              y={toY(tick) + 3}
              textAnchor="end"
              className="fill-brand-sage text-[8px]"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xTicks.map((year) => (
          <text
            key={`x-${year}`}
            x={toX(year)}
            y={height - 4}
            textAnchor="middle"
            className="fill-brand-sage text-[8px]"
          >
            {year}
          </text>
        ))}

        {/* Historical line */}
        <path
          d={historicalPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand-forest dark:text-brand-sage"
        />

        {/* Projected line (dashed) */}
        {projectedPath && (
          <path
            d={projectedPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 3"
            className="text-brand-sage/60"
          />
        )}

        {/* User points horizontal line */}
        {userPoints !== undefined && (
          <>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={toY(userPoints)}
              y2={toY(userPoints)}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="text-brand-sunset"
            />
            <text
              x={width - padRight + 2}
              y={toY(userPoints) + 3}
              className="fill-brand-sunset text-[7px] font-bold"
            >
              You
            </text>
          </>
        )}

        {/* Data points */}
        {historicalData.map((d) => (
          <circle
            key={`h-${d.year}`}
            cx={toX(d.year)}
            cy={toY(d.points)}
            r="2.5"
            className="fill-brand-forest dark:fill-brand-sage"
          />
        ))}
      </svg>

      {/* Annotation */}
      {estimatedDrawYear && (
        <p className="mt-2 text-center text-sm font-medium text-brand-bark dark:text-brand-cream">
          Estimated draw: ~{estimatedDrawYear}{" "}
          <span className="text-brand-sage font-normal">
            (~{estimatedDrawYear - new Date().getFullYear()} years)
          </span>
        </p>
      )}
    </div>
  );
}
