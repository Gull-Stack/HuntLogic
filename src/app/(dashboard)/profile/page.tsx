export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Profile
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Your hunter profile and account details
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-brand-sage">
          Manage your hunter profile, experience level, and account settings.
        </p>
      </div>
    </div>
  );
}
