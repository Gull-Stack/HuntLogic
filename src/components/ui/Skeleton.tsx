"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "custom";
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded-md",
    card: "h-32 w-full rounded-xl",
    circle: "h-10 w-10 rounded-full",
    custom: "",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-brand-sage/10 dark:bg-brand-sage/20",
        variantStyles[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full rounded-xl border border-brand-sage/10 p-4 space-y-3">
      <Skeleton variant="text" className="h-5 w-3/4" />
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="custom" className="h-8 w-20 rounded-full" />
        <Skeleton variant="custom" className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
