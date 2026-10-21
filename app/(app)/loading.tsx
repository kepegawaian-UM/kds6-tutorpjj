export default function Loading() {
  return (
    <div role="status" aria-label="Memuat data" className="animate-pulse space-y-4">
      <div className="h-7 w-56 rounded-md bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-2" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-2" />
    </div>
  );
}
