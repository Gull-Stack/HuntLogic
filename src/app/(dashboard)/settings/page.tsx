export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Settings
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          App settings, notifications, and account management
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-brand-sage">
          Manage notification preferences, theme, data export, and account
          settings.
        </p>
      </div>
    </div>
  );
}
