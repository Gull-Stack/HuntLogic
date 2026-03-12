"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { AlertTriangle, Info, AlertCircle, CheckCircle, X } from "lucide-react";

type AlertType = "info" | "warning" | "urgent" | "success";

interface Alert {
  id: string;
  type: AlertType;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: typeof Info }> = {
  info: {
    bg: "bg-brand-sky/10",
    border: "border-brand-sky/30",
    text: "text-brand-sky",
    icon: Info,
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-amber-700",
    icon: AlertTriangle,
  },
  urgent: {
    bg: "bg-danger/10",
    border: "border-danger/30",
    text: "text-red-700",
    icon: AlertCircle,
  },
  success: {
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-green-700",
    icon: CheckCircle,
  },
};

export function AlertBanner({ alerts: initialAlerts, onDismiss }: AlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = initialAlerts.filter((a) => !dismissedIds.has(a.id));

  if (visibleAlerts.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    onDismiss?.(id);
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const style = alertStyles[alert.type];
        const Icon = style.icon;

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 animate-slide-up",
              style.bg,
              style.border
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", style.text)} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", style.text)}>
                {alert.message}
              </p>
              {alert.ctaLabel && alert.ctaHref && (
                <a
                  href={alert.ctaHref}
                  className={cn(
                    "mt-1 inline-block text-sm font-semibold underline underline-offset-2",
                    style.text
                  )}
                >
                  {alert.ctaLabel}
                </a>
              )}
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className={cn("shrink-0 p-1 rounded-md hover:bg-black/5", style.text)}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
