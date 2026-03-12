export default function PricingPage() {
  return (
    <div className="min-h-screen px-[var(--spacing-page-x)] py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-forest">Pricing</h1>
        <p className="mx-auto mt-2 max-w-xl text-brand-sage">
          Choose the plan that fits your hunting ambitions
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
        {/* Pricing cards will be implemented here */}
        <div className="card text-center">
          <h3 className="text-lg font-semibold">Scout</h3>
          <p className="mt-1 text-sm text-brand-sage">Free tier</p>
        </div>
        <div className="card border-2 border-brand-forest text-center">
          <h3 className="text-lg font-semibold">Hunter</h3>
          <p className="mt-1 text-sm text-brand-sage">Pro tier</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold">Outfitter</h3>
          <p className="mt-1 text-sm text-brand-sage">Team tier</p>
        </div>
      </div>
    </div>
  );
}
