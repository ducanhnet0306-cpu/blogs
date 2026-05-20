import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Tag, ApiListResponse } from '@/types';

export const metadata: Metadata = { title: 'Tags' };

export default async function TagsPage() {
  let tags: Tag[] = [];

  try {
    const res = await apiFetch<ApiListResponse<Tag>>('/tags', {
      next: { revalidate: 300 },
    });
    tags = res.data ?? [];
  } catch {
    // API chưa sẵn sàng
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Tags</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Tìm kiếm bài viết theo từ khóa
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-700">
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Chưa có tag nào
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Xem tất cả bài viết
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-300"
            >
              <span className="text-slate-400 group-hover:text-blue-500">#</span>
              {tag.name}
              {tag.posts_count !== undefined && tag.posts_count > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300">
                  {tag.posts_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
