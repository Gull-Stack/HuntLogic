export default function FeaturesPage() {
  return (
    <div className="min-h-screen px-[var(--spacing-page-x)] py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-forest">Features</h1>
        <p className="mx-auto mt-2 max-w-xl text-brand-sage">
          Everything HuntLogic Concierge offers to elevate your hunting game
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="text-lg font-semibold">AI Hunt Concierge</h3>
          <p className="mt-2 text-sm text-brand-sage">
            Chat with an AI expert that knows western big game regulations,
            draw systems, and strategy.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Draw Odds Analysis</h3>
          <p className="mt-2 text-sm text-brand-sage">
            Real-time draw odds data with historical trends and predictive
            modeling.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Strategic Playbooks</h3>
          <p className="mt-2 text-sm text-brand-sage">
            Multi-year application strategies optimized for your goals and point
            holdings.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Deadline Alerts</h3>
          <p className="mt-2 text-sm text-brand-sage">
            Never miss an application deadline with personalized push
            notifications.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Map Explorer</h3>
          <p className="mt-2 text-sm text-brand-sage">
            Interactive maps with hunt unit boundaries, terrain, and public
            land access.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold">Harvest Intelligence</h3>
          <p className="mt-2 text-sm text-brand-sage">
            Historical harvest statistics and success rates by unit, weapon,
            and season.
          </p>
        </div>
      </div>
    </div>
  );
}
