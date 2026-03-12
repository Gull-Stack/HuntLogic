export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Hunting Preferences
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Configure your target species, states, and hunting style
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-brand-sage">
          Update your preferred species, weapon types, hunt styles, and target
          states to refine your recommendations.
        </p>
      </div>
    </div>
  );
}
