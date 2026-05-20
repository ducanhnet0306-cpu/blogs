export default function TagsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 h-9 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800"
            style={{ width: `${60 + (i % 5) * 20}px` }}
          />
        ))}
      </div>
    </div>
  );
}
