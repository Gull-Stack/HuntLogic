"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bell, Menu, Check } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

interface TopBarProps {
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
  "/profile/preferences": "Preferences",
  "/profile/strategy": "Annual Strategy",
  "/settings": "Settings",
  "/profile/harvest": "Harvest Log",
  "/simulation": "Simulator",
  "/groups": "Hunt Groups",
  "/outfitters": "Outfitters",
  "/orders": "Orders",
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = routeTitles[pathname ?? ""] || "HuntLogic";
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
        setItems(data.notifications ?? []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", notificationId: n.id }),
      });
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
    }
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
    setShowDropdown(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-[100] flex h-14 items-center justify-between border-b border-brand-sage/10 bg-white/80 px-4 backdrop-blur-lg lg:hidden dark:bg-brand-bark/80 dark:border-brand-sage/20"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-bark transition-colors hover:bg-brand-sage/10 dark:text-brand-cream lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold text-brand-bark dark:text-brand-cream">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-brand-bark transition-colors hover:bg-brand-sage/10 dark:text-brand-cream"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-sunset px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-[200]"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-12 z-[201] w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-brand-sage/10 bg-white shadow-lg dark:bg-brand-bark dark:border-brand-sage/20">
                <div className="flex items-center justify-between border-b border-brand-sage/10 px-4 py-3 dark:border-brand-sage/20">
                  <span className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-brand-sage hover:text-brand-forest"
                    >
                      <Check className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-brand-sage">
                      No notifications yet
                    </p>
                  ) : (
                    items.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-brand-sage/5",
                          !n.read && "bg-brand-forest/5 dark:bg-brand-sage/10"
                        )}
                      >
                        <p className={cn(
                          "text-sm",
                          n.read
                            ? "text-brand-sage"
                            : "font-medium text-brand-bark dark:text-brand-cream"
                        )}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-brand-sage line-clamp-2">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-brand-sage/60">
                          {formatTimeAgo(n.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-brand-cream">
          H
        </div>
      </div>
    </header>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
