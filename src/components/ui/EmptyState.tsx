"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage/10 text-brand-sage">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-brand-sage">
        {description}
      </p>
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary">{actionLabel}</Button>
            </a>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
