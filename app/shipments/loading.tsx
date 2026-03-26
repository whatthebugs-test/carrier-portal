export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading shipments">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="card h-96 animate-pulse bg-slate-100" />
    </div>
  );
}
