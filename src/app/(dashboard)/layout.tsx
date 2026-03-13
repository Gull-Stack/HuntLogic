"use client";

import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { TenantProvider } from "@/components/providers/TenantProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TenantProvider>
      <div className="min-h-screen bg-brand-cream dark:bg-brand-forest">
        {/* Desktop Sidebar — visible lg+ */}
        <Sidebar />

        {/* Mobile TopBar — visible below lg */}
        <TopBar />

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
