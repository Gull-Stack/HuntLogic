export default function ForecastsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Forecasts
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Draw odds predictions and trend analysis
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-brand-sage">
          ML-powered forecasts for draw odds, tag allocations, and application
          trends. Predictions are updated as new data becomes available.
        </p>
      </div>
    </div>
  );
}
