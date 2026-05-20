import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `#${slug}` };
}

export default async function TagPostsPage({ params }: Props) {
  const { slug } = await params;

  let posts: Post[] = [];
  let total = 0;

  try {
    const res = await apiFetch<PaginatedResponse<Post>>(
      `/tags/${slug}/posts?per_page=12`,
      { cache: 'no-store' }
    );
    posts = res.data;
    total = res.meta.total;
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        <Link href="/" className="transition hover:text-blue-600 dark:hover:text-blue-400">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/tags" className="transition hover:text-blue-600 dark:hover:text-blue-400">
          Tags
        </Link>
        <span>/</span>
        <span className="text-slate-600 dark:text-slate-300">#{slug}</span>
      </nav>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          #{slug}
        </span>
      </div>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> bài viết
      </p>

      {posts.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Chưa có bài viết nào với tag này.
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Xem tất cả bài viết
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              {post.thumbnail ? (
                <div className="overflow-hidden rounded-t-2xl">
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-44 rounded-t-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950" />
              )}

              <div className="flex flex-1 flex-col p-5">
                {post.category && (
                  <Link
                    href={`/categories/${post.category.slug}`}
                    className="mb-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
                  >
                    {post.category.name}
                  </Link>
                )}
                <h2 className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {post.excerpt}
                  </p>
                )}
                {post.published_at && (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
                    {new Date(post.published_at).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
