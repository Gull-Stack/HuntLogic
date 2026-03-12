export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">
          Map Explorer
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Interactive map of hunt units, boundaries, and terrain
        </p>
      </div>

      <div className="card aspect-video">
        <p className="text-sm text-brand-sage">
          MapLibre GL map will be rendered here with hunt unit boundaries,
          terrain layers, and points of interest.
        </p>
      </div>
    </div>
  );
}
