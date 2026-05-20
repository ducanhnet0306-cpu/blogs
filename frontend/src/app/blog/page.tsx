import Link from 'next/link';
import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api';
import type { Post, Category, PaginatedResponse, ApiListResponse } from '@/types';

export const metadata: Metadata = { title: 'Blog' };

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ?? '1';
  const keyword = params.keyword ?? '';
  const categorySlug = params.category ?? '';

  let posts: Post[] = [];
  let total = 0;
  let lastPage = 1;
  let categories: Category[] = [];

  try {
    const [postsRes, catsRes] = await Promise.all([
      apiFetch<PaginatedResponse<Post>>(
        `/posts?${new URLSearchParams({
          page,
          per_page: '9',
          ...(keyword && { keyword }),
          ...(categorySlug && { category: categorySlug }),
        })}`,
        { cache: 'no-store' }
      ),
      apiFetch<ApiListResponse<Category>>('/categories', {
        next: { revalidate: 300 },
      }),
    ]);
    posts = postsRes.data;
    total = postsRes.meta.total;
    lastPage = postsRes.meta.last_page;
    categories = catsRes.data ?? [];
  } catch {
    // API chưa sẵn sàng
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams({
      page: String(p),
      ...(keyword && { keyword }),
      ...(categorySlug && { category: categorySlug }),
    });
    return `/blog?${q}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Blog
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          {total > 0 ? (
            <>
              <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> bài viết
              {keyword && <> cho &ldquo;{keyword}&rdquo;</>}
              {categorySlug && !keyword && <> trong danh mục &ldquo;{categorySlug}&rdquo;</>}
            </>
          ) : (
            'Không có bài viết'
          )}
        </p>
      </div>

      {/* Search */}
      <form className="mt-6 flex gap-2" method="GET" action="/blog">
        <input
          name="keyword"
          defaultValue={keyword}
          placeholder="Tìm kiếm bài viết..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-400"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95"
        >
          Tìm kiếm
        </button>
        {(keyword || categorySlug) && (
          <Link
            href="/blog"
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Xóa
          </Link>
        )}
      </form>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        {/* Post grid */}
        <div className="min-w-0 flex-1">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-700">
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {keyword
                  ? `Không tìm thấy kết quả cho "${keyword}"`
                  : 'Chưa có bài viết nào'}
              </p>
              {(keyword || categorySlug) && (
                <Link
                  href="/blog"
                  className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Xem tất cả bài viết
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Phân trang">
                  {Number(page) > 1 && (
                    <Link
                      href={buildHref(Number(page) - 1)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      ← Trước
                    </Link>
                  )}

                  {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => {
                    const isCurrent = String(p) === page;
                    const dist = Math.abs(p - Number(page));
                    const isEdge = p === 1 || p === lastPage;
                    const showPage = dist <= 1 || isEdge;
                    const showDots =
                      (p === 2 && Number(page) > 3) || (p === lastPage - 1 && Number(page) < lastPage - 2);

                    if (!showPage && !showDots) return null;
                    if (showDots && !showPage) {
                      return (
                        <span key={p} className="px-1 text-slate-400 select-none">
                          …
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={p}
                        href={buildHref(p)}
                        className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-center text-sm font-medium transition ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}

                  {Number(page) < lastPage && (
                    <Link
                      href={buildHref(Number(page) + 1)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Sau →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        {categories.length > 0 && (
          <aside className="w-full shrink-0 lg:w-60">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Danh mục
              </h3>
              <ul className="mt-4 space-y-0.5">
                <li>
                  <Link
                    href="/blog"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      !categorySlug
                        ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                    Tất cả
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/blog?category=${cat.slug}`}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        categorySlug === cat.slug
                          ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function BlogPostCard({ post }: { post: Post }) {
  const readingTime = post.content
    ? Math.max(1, Math.round(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
    : null;

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
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
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <Link
              href={`/blog?category=${post.category.slug}`}
              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {post.category.name}
            </Link>
          )}
          {readingTime && (
            <span className="text-xs text-slate-400">{readingTime} phút</span>
          )}
        </div>

        <h2 className="mt-2 flex-1 text-base font-semibold leading-snug text-slate-900 dark:text-white">
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

        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {post.author?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="max-w-[80px] truncate text-xs text-slate-500 dark:text-slate-400">
              {post.author?.name ?? 'Ẩn danh'}
            </span>
          </div>
          {post.published_at && (
            <span className="text-xs text-slate-400">
              {new Date(post.published_at).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
