import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { ApiResponse, Post, PaginatedResponse } from '@/types';
import { ShareButtons } from '@/components/blog/ShareButtons';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await apiFetch<ApiResponse<Post>>(`/posts/${slug}`, { cache: 'no-store' });
    const post = res.data;
    return {
      title: post.seo?.title || post.title,
      description: post.seo?.description || post.excerpt || '',
      keywords: post.seo?.keywords || post.tags?.map((t) => t.name).join(', '),
      openGraph: {
        title: post.title,
        description: post.excerpt ?? '',
        images: post.thumbnail ? [post.thumbnail] : [],
        type: 'article',
        publishedTime: post.published_at ?? undefined,
        authors: post.author ? [post.author.name] : [],
      },
    };
  } catch {
    return { title: 'Bài viết' };
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;

  let post: Post | null = null;
  let relatedPosts: Post[] = [];

  try {
    const res = await apiFetch<ApiResponse<Post>>(`/posts/${slug}`, { cache: 'no-store' });
    post = res.data;
  } catch {
    notFound();
  }

  if (!post) notFound();

  // Tải bài viết liên quan cùng danh mục
  if (post.category) {
    try {
      const related = await apiFetch<PaginatedResponse<Post>>(
        `/categories/${post.category.slug}/posts?per_page=4`,
        { next: { revalidate: 300 } }
      );
      relatedPosts = related.data.filter((p) => p.slug !== slug).slice(0, 3);
    } catch {
      // ignore
    }
  }

  const readingTime = post.content
    ? Math.max(1, Math.round(post.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
    : null;

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
        <Link href="/" className="transition hover:text-blue-600 dark:hover:text-blue-400">Trang chủ</Link>
        <span>/</span>
        <Link href="/blog" className="transition hover:text-blue-600 dark:hover:text-blue-400">Blog</Link>
        <span>/</span>
        <span className="line-clamp-1 text-slate-600 dark:text-slate-300">{post.title}</span>
      </nav>

      <div className="lg:flex lg:gap-12">
        {/* Main article */}
        <article className="min-w-0 flex-1">
          {/* Category */}
          {post.category && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              {post.category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 dark:text-white md:text-4xl">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-slate-200 pb-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {post.author && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {post.author.name[0].toUpperCase()}
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-200">{post.author.name}</span>
              </div>
            )}

            {post.published_at && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {new Date(post.published_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </div>
            )}

            {readingTime && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readingTime} phút đọc
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.view_count.toLocaleString('vi-VN')} lượt xem
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Thumbnail */}
          {post.thumbnail && (
            <div className="mt-8 overflow-hidden rounded-2xl">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-8 border-l-4 border-blue-500 pl-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose-content mt-8"
            dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />

          {/* Share + footer */}
          <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <ShareButtons title={post.title} url={postUrl} />
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bài viết có hữu ích không? Chia sẻ để nhiều người biết hơn!
              </p>
              <Link
                href="/blog"
                className="text-sm font-medium text-blue-600 transition hover:underline dark:text-blue-400"
              >
                ← Quay lại Blog
              </Link>
            </div>
          </div>

          {/* Author card */}
          {post.author && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                {post.author.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{post.author.name}</p>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Tác giả tại EnterpriseBlog
                </p>
              </div>
            </div>
          )}
        </article>

        {/* Sidebar — Related posts (desktop) */}
        {relatedPosts.length > 0 && (
          <aside className="hidden lg:block lg:w-72 lg:shrink-0">
            <div className="sticky top-24">
              <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Bài viết liên quan</h3>
              <div className="space-y-4">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    {related.thumbnail ? (
                      <img
                        src={related.thumbnail}
                        alt={related.title}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950" />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {related.title}
                      </p>
                      {related.published_at && (
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(related.published_at).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Related posts — mobile (below article) */}
      {relatedPosts.length > 0 && (
        <section className="mt-12 lg:hidden">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Bài viết liên quan</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {related.thumbnail ? (
                  <img
                    src={related.thumbnail}
                    alt={related.title}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950" />
                )}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-blue-600 dark:text-white">
                    {related.title}
                  </p>
                  {related.published_at && (
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(related.published_at).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
