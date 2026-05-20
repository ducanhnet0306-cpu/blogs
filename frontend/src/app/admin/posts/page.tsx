'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/Modal';
import type { Post, PaginatedResponse } from '@/types';

type StatusFilter = 'all' | 'published' | 'draft' | 'archived';

const STATUS_LABELS: Record<string, string> = {
  published: 'Đã xuất bản',
  draft: 'Nháp',
  archived: 'Lưu trữ',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
};

export default function AdminPostsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const page = Number(searchParams.get('page') ?? '1');
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;
  const keyword = searchParams.get('keyword') ?? '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '15',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(keyword && { keyword }),
      });
      const res = await clientFetch<PaginatedResponse<Post>>(`/admin/posts?${params}`);
      setPosts(res.data);
      setTotal(res.meta.total);
      setLastPage(res.meta.last_page);
    } catch {
      toastError('Không thể tải danh sách bài viết');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, keyword]);

  useEffect(() => { load(); }, [load]);

  const buildHref = (p: number) => {
    const q = new URLSearchParams({ page: String(p), ...(statusFilter !== 'all' && { status: statusFilter }), ...(keyword && { keyword }) });
    return `/admin/posts?${q}`;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await clientFetch(`/admin/posts/${deleteTarget.id}`, { method: 'DELETE' });
      success('Đã xóa bài viết');
      setDeleteTarget(null);
      load();
    } catch {
      toastError('Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (post: Post) => {
    try {
      await clientFetch(`/admin/posts/${post.id}/publish`, { method: 'PATCH' });
      success('Đã xuất bản bài viết');
      load();
    } catch {
      toastError('Xuất bản thất bại');
    }
  };

  const handleArchive = async (post: Post) => {
    try {
      await clientFetch(`/admin/posts/${post.id}/archive`, { method: 'PATCH' });
      success('Đã lưu trữ bài viết');
      load();
    } catch {
      toastError('Lưu trữ thất bại');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bài viết</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{total} bài viết</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Bài viết mới
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['all', 'published', 'draft', 'archived'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => router.push(`/admin/posts?status=${s}`)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {s === 'all' ? 'Tất cả' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Search */}
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const kw = (e.currentTarget.elements.namedItem('keyword') as HTMLInputElement).value;
            router.push(`/admin/posts?keyword=${encodeURIComponent(kw)}`);
          }}
        >
          <input
            name="keyword"
            defaultValue={keyword}
            placeholder="Tìm kiếm..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Tiêu đề</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 md:table-cell">Tác giả</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 lg:table-cell">Danh mục</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Trạng thái</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 md:table-cell">Ngày tạo</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    Không có bài viết nào
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="line-clamp-1 font-medium text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {post.title}
                      </Link>
                      {post.is_featured && (
                        <span className="ml-2 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                          Nổi bật
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 md:table-cell">
                      {post.author?.name ?? '—'}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 lg:table-cell">
                      {post.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status] ?? STATUS_COLORS.draft}`}>
                        {STATUS_LABELS[post.status] ?? post.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-400 dark:text-slate-500 md:table-cell">
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {post.status !== 'published' && (
                          <button
                            onClick={() => handlePublish(post)}
                            title="Xuất bản"
                            className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {post.status === 'published' && (
                          <button
                            onClick={() => handleArchive(post)}
                            title="Lưu trữ"
                            className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        )}
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          title="Sửa"
                          className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          title="Xem"
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          title="Xóa"
                          className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-1 border-t border-slate-100 p-4 dark:border-slate-700">
            {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildHref(p)}
                className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                  p === page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa bài viết"
        description={`Bạn có chắc muốn xóa "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
