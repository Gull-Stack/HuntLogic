export default function RecommendationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Recommendations
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          AI-powered hunt recommendations tailored to your profile
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-brand-sage">
          Recommendations will appear here based on draw odds analysis, your
          preference points, and hunting goals.
        </p>
      </div>
    </div>
  );
}
