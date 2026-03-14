"use client";

import { useState } from "react";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { TenantProvider } from "@/components/providers/TenantProvider";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <TenantProvider>
      <div className="min-h-screen bg-brand-cream dark:bg-brand-forest">
        {/* Desktop Sidebar — visible lg+ */}
        <Sidebar />

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-64">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Mobile TopBar — visible below lg */}
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Main content */}
        <main className="pb-20 lg:pb-0 lg:pl-64">
          <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Tabs — visible below md */}
        <BottomTabBar />
      </div>
    </TenantProvider>
  );
}
