"use client";

import { useState } from "react";
import { OpsSidebar } from "@/components/layout/OpsSidebar";
import { OpsAuthProvider, useOpsAuth } from "@/components/providers/OpsAuthProvider";
import { Menu, X } from "lucide-react";

function OpsTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/10 bg-gray-950/95 px-4 backdrop-blur-sm lg:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-sm font-bold text-white">{process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic"} Ops</h1>
    </header>
  );
}

function OpsShellContent({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoading } = useOpsAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Desktop Sidebar */}
      <OpsSidebar />

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-64">
            <OpsSidebar />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-[-44px] flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-gray-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile TopBar */}
      <OpsTopBar onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function OpsShell({ children }: { children: React.ReactNode }) {
  return (
    <OpsAuthProvider>
      <OpsShellContent>{children}</OpsShellContent>
    </OpsAuthProvider>
  );
}
