export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
