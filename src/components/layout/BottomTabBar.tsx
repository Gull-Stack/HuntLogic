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
} from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/playbook", label: "Playbook", icon: BookOpen },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-brand-sage/10 bg-white/95 backdrop-blur-md md:hidden dark:bg-brand-bark/95 dark:border-brand-sage/20"
      style={{
        height: "calc(56px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-14 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname?.startsWith(tab.href + "/");
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors",
                isActive
                  ? "text-brand-forest dark:text-brand-cream"
                  : "text-brand-sage/60 dark:text-brand-sage"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "text-brand-forest dark:text-brand-cream"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
