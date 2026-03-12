export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-lg">
        <h1 className="text-2xl font-bold text-brand-forest">
          Set up your hunter profile
        </h1>
        <p className="mt-2 text-sm text-brand-sage">
          Tell us about your hunting experience, target species, and preferred
          states so we can personalize your recommendations.
        </p>
        {/* Multi-step onboarding wizard will be implemented here */}
      </div>
    </div>
  );
}
