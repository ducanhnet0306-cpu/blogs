export default function CategoriesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 h-9 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
