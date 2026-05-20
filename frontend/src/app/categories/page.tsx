import type { Metadata } from 'next';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Category, ApiListResponse } from '@/types';

export const metadata: Metadata = { title: 'Danh mục' };

export default async function CategoriesPage() {
  let categories: Category[] = [];

  try {
    const res = await apiFetch<ApiListResponse<Category>>('/categories', {
      next: { revalidate: 300 },
    });
    categories = res.data ?? [];
  } catch {
    // API chưa sẵn sàng
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Danh mục
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Khám phá nội dung theo chủ đề bạn quan tâm
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-700">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
          </div>
          <p className="mt-4 text-lg font-medium text-slate-500 dark:text-slate-400">
            Chưa có danh mục nào
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Xem tất cả bài viết
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:group-hover:bg-blue-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                </svg>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                {cat.name}
              </h2>

              {cat.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {cat.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                Xem bài viết
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
