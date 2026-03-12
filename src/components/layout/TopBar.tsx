"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bell, Menu } from "lucide-react";

interface TopBarProps {
  notificationCount?: number;
  onMenuClick?: () => void;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/playbook": "Playbook",
  "/recommendations": "Recommendations",
  "/explore": "Explore",
  "/forecasts": "Forecasts",
  "/calendar": "Calendar",
  "/chat": "Chat",
  "/profile": "Profile",
  "/profile/points": "Preference Points",
  "/settings": "Settings",
};

export function TopBar({ notificationCount = 0, onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = routeTitles[pathname ?? ""] || "HuntLogic";

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-brand-sage/10 bg-white/80 px-4 backdrop-blur-lg lg:hidden dark:bg-brand-bark/80 dark:border-brand-sage/20"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Left: Menu button (mobile only) */}
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-bark transition-colors hover:bg-brand-sage/10 dark:text-brand-cream lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Center: Page title */}
      <h1 className="text-base font-semibold text-brand-bark dark:text-brand-cream">
        {title}
      </h1>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-2">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-brand-bark transition-colors hover:bg-brand-sage/10 dark:text-brand-cream"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-sunset px-1 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-brand-cream">
          H
        </div>
      </div>
    </header>
  );
}
