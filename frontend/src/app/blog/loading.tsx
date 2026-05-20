import { PostGridSkeleton } from '@/components/ui/Skeleton';

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 h-9 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mb-6 h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      <PostGridSkeleton count={9} />
    </div>
  );
}
