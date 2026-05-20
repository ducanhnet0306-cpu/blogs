import { Skeleton } from '@/components/ui/Skeleton';

export default function PostLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="mb-3 h-10 w-full" />
      <Skeleton className="mb-2 h-10 w-3/4" />
      <div className="mb-8 flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mb-8 h-72 w-full rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}
