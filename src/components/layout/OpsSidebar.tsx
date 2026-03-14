"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ListTodo,
  Package,
  Users,
  BarChart3,
  DollarSign,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useOpsAuth } from "@/components/providers/OpsAuthProvider";
import { Badge } from "@/components/ui/Badge";

interface NavItem {
  href: string;
  label: string;
  icon: typeof ListTodo;
  roles?: ("agent" | "supervisor" | "admin")[];
}

const navItems: NavItem[] = [
  { href: "/ops", label: "Queue", icon: ListTodo },
  { href: "/ops/orders", label: "Orders", icon: Package },
  { href: "/ops/agents", label: "Agents", icon: Users, roles: ["admin", "supervisor"] },
  { href: "/ops/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/ops/fees", label: "Fee Schedules", icon: DollarSign },
];

const ROLE_BADGE_VARIANT: Record<string, "info" | "warning" | "success"> = {
  agent: "info",
  supervisor: "warning",
  admin: "success",
};

export function OpsSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { opsUser, logout } = useOpsAuth();

  const userRole = opsUser?.role ?? "agent";
  const userName = opsUser?.displayName ?? "Operator";
  const userInitial = userName.charAt(0).toUpperCase();

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[100] hidden flex-col border-r border-white/10 bg-gray-950 transition-all duration-300 lg:flex",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold text-white">
              {process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic"}
            </h2>
            <p className="text-[10px] font-medium tracking-wider uppercase text-gray-400">
              Ops Portal
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
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
        {visibleNavItems.map((item) => {
          const isActive =
            item.href === "/ops"
              ? pathname === "/ops"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", isActive && "text-blue-400")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/10" />

      {/* User section */}
      <div className={cn("p-3", collapsed && "flex flex-col items-center")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {userInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>
              <Badge
                variant={ROLE_BADGE_VARIANT[userRole] ?? "info"}
                size="sm"
                className="mt-0.5"
              >
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={cn(
            "flex min-h-[36px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-red-400 transition-colors mt-2 w-full",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
