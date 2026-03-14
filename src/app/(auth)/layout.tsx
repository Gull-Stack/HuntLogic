// =============================================================================
// Auth Layout — Clean, centered layout for login/signup/verify pages
// =============================================================================

import { config } from "@/lib/config";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-4 dark:bg-brand-forest">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231B4332' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest dark:text-brand-cream">
          {config.app.brandName}
        </h1>
        <p className="mt-1 text-sm font-medium tracking-wider uppercase text-brand-sage">
          Your AI-Powered Hunt Strategist
        </p>
      </div>

      {/* Content */}
      <div className="w-full max-w-sm">
        {children}
      </div>

      {/* Safe area bottom padding for mobile */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
