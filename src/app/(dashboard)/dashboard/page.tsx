export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Your hunting intelligence at a glance
        </p>
      </div>

      {/* Upcoming deadlines card */}
      <div className="card">
        <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
        <p className="mt-2 text-sm text-brand-sage">
          No upcoming deadlines. Check back soon.
        </p>
      </div>

      {/* Active recommendations card */}
      <div className="card">
        <h2 className="text-lg font-semibold">Active Recommendations</h2>
        <p className="mt-2 text-sm text-brand-sage">
          Complete your profile to receive personalized recommendations.
        </p>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <p className="mt-2 text-sm text-brand-sage">
          Start exploring hunt units, check draw odds, or update your playbook.
        </p>
      </div>
    </div>
  );
}
