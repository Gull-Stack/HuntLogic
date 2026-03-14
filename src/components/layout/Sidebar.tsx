"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Compass,
  MessageCircle,
  User,
  BarChart3,
  CalendarDays,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  Target,
  Dice5,
  Users,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTenant } from "@/components/providers/TenantProvider";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/playbook", label: "Playbook", icon: BookOpen },
  { href: "/recommendations", label: "Recommendations", icon: Star },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/forecasts", label: "Forecasts", icon: BarChart3 },
  { href: "/simulation", label: "Simulate", icon: Dice5 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/outfitters", label: "Outfitters", icon: MapPin },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const bottomNavItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/profile/harvest", label: "Harvest Log", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { tenantConfig } = useTenant();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Hunter";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[100] hidden flex-col border-r border-brand-sage/10 bg-white transition-all duration-300 lg:flex dark:bg-brand-bark dark:border-brand-sage/20",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-brand-sage/10 dark:border-brand-sage/20">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold text-brand-forest dark:text-brand-cream">
              {tenantConfig.brandName}
            </h2>
            <p className="text-[10px] font-medium tracking-wider uppercase text-brand-sage">
              Concierge
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage hover:bg-brand-sage/10 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-forest/10 text-brand-forest dark:bg-brand-sage/20 dark:text-brand-cream"
                  : "text-brand-bark/70 hover:bg-brand-sage/5 dark:text-brand-cream/60 dark:hover:bg-brand-sage/10",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", isActive && "text-brand-forest dark:text-brand-cream")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-brand-sage/10 dark:border-brand-sage/20" />

      {/* Bottom Navigation */}
      <div className="p-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-forest/10 text-brand-forest dark:bg-brand-sage/20 dark:text-brand-cream"
                  : "text-brand-bark/70 hover:bg-brand-sage/5 dark:text-brand-cream/60 dark:hover:bg-brand-sage/10",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className={cn(
        "border-t border-brand-sage/10 p-3 dark:border-brand-sage/20",
        collapsed && "flex justify-center"
      )}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-forest text-sm font-bold text-brand-cream">
            {userInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brand-bark dark:text-brand-cream">
                {userName}
              </p>
              <p className="truncate text-xs text-brand-sage">
                Free Plan
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
