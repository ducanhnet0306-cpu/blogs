import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Post, PaginatedResponse } from '@/types';

export default async function HomePage() {
  let featuredPosts: Post[] = [];
  let latestPosts: Post[] = [];

  try {
    const [featured, latest] = await Promise.all([
      apiFetch<PaginatedResponse<Post>>('/posts?featured=1&per_page=3', { cache: 'no-store' }),
      apiFetch<PaginatedResponse<Post>>('/posts?per_page=6', { cache: 'no-store' }),
    ]);
    featuredPosts = featured.data;
    latestPosts = latest.data;
  } catch {
    // API chưa sẵn sàng, hiển thị trang trống
  }

  return (
    <div>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-24 text-white dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        {/* Grid decoration */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 ring-1 ring-white/20 backdrop-blur">
            Enterprise Blog Platform
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Kiến thức &amp; <br className="hidden sm:block" />
            Câu chuyện
          </h1>
          <p className="mt-5 text-lg text-blue-100/80 md:text-xl">
            Khám phá những bài viết chuyên sâu từ đội ngũ chuyên gia của chúng tôi
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/blog"
              className="w-full rounded-xl bg-white px-8 py-3 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl sm:w-auto"
            >
              Đọc bài viết
            </Link>
            <Link
              href="/categories"
              className="w-full rounded-xl bg-white/10 px-8 py-3 font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20 sm:w-auto"
            >
              Xem danh mục
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured posts ─── */}
      {featuredPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionTitle>Bài viết nổi bật</SectionTitle>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} featured />
            ))}
          </div>
        </section>
      )}

      {/* ─── Latest posts ─── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-between">
          <SectionTitle>Bài viết mới nhất</SectionTitle>
          <Link
            href="/blog"
            className="text-sm font-medium text-blue-600 transition hover:underline dark:text-blue-400"
          >
            Xem tất cả →
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-700">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
              Chưa có bài viết nào
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Hãy tạo bài viết đầu tiên trong Admin Panel
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Vào Admin Panel
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Stats strip ─── */}
      <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { label: 'Bài viết', value: '100+' },
              { label: 'Danh mục', value: '20+' },
              { label: 'Tags', value: '50+' },
              { label: 'Lượt đọc', value: '10K+' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{value}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-7 w-1 rounded-full bg-blue-600" />
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{children}</h2>
    </div>
  );
}

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const readingTime = post.content
    ? Math.max(1, Math.round(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
    : null;

  return (
    <article
      className={`group flex flex-col rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
        featured
          ? 'border-blue-200 dark:border-blue-900'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Thumbnail */}
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
        {/* Category + reading time */}
        <div className="flex flex-wrap items-center gap-2">
          {post.category && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {post.category.name}
            </Link>
          )}
          {readingTime && (
            <span className="text-xs text-slate-400">{readingTime} phút đọc</span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2 flex-1 text-base font-semibold leading-snug text-slate-900 dark:text-white">
          <Link
            href={`/blog/${post.slug}`}
            className="line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {post.author?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="max-w-[100px] truncate text-xs text-slate-500 dark:text-slate-400">
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
