import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/playbook", label: "Playbook", icon: "book" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/profile", label: "Profile", icon: "user" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="safe-area-top safe-area-bottom min-h-screen bg-brand-cream pb-20 dark:bg-brand-forest md:pb-0 md:pl-64">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-brand-sage/10 bg-white p-6 dark:bg-brand-bark md:block">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-brand-forest dark:text-brand-cream">
            HuntLogic
          </h2>
          <p className="text-xs text-brand-sage">Concierge</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-bark transition-colors hover:bg-brand-cream dark:text-brand-cream dark:hover:bg-brand-forest/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="px-[var(--spacing-page-x)] py-[var(--spacing-page-y)]">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav border-t border-brand-sage/10 bg-white dark:bg-brand-bark md:hidden">
        <div className="flex h-full items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-brand-sage transition-colors"
            >
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
