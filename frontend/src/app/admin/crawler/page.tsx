'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';

interface CrawledItem {
  id: number;
  source_url: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  thumbnail: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: 'pending' | 'published' | 'rejected';
  post_id: number | null;
  post: { id: number; title: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}

interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

// ── Preview modal ──────────────────────────────────────────────────────────────
function PreviewModal({
  item,
  onClose,
  onPublish,
  onReject,
}: {
  item: CrawledItem;
  onClose: () => void;
  onPublish: (id: number, status: 'draft' | 'published') => Promise<void>;
  onReject: (id: number) => Promise<void>;
}) {
  const [publishing, setPublishing] = useState<'draft' | 'published' | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const handlePublish = async (s: 'draft' | 'published') => {
    setPublishing(s);
    await onPublish(item.id, s);
    setPublishing(null);
  };

  const handleReject = async () => {
    setRejecting(true);
    await onReject(item.id);
    setRejecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-10 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-slate-800 mb-10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-700">
          <div className="flex-1 pr-4">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium mb-2 ${
              item.status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : item.status === 'rejected'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {item.status === 'published' ? 'Đã publish' : item.status === 'rejected' ? 'Đã từ chối' : 'Chờ xử lý'}
            </span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
              {item.title ?? '(Không có tiêu đề)'}
            </h2>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400 break-all"
            >
              {item.source_url}
            </a>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 flex-shrink-0"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content preview */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {item.thumbnail && (
            <img
              src={item.thumbnail}
              alt=""
              className="w-full max-h-64 object-cover rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {item.excerpt && (
            <p className="text-sm text-slate-600 dark:text-slate-400 italic border-l-4 border-blue-300 pl-3">
              {item.excerpt}
            </p>
          )}

          {item.content ? (
            <div
              className="prose prose-slate max-w-none text-sm dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          ) : (
            <p className="text-sm text-slate-400 italic">Không có nội dung</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-slate-200 p-5 dark:border-slate-700">
          {item.status === 'pending' ? (
            <>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {rejecting ? 'Đang xử lý...' : 'Từ chối'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePublish('draft')}
                  disabled={!!publishing}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300"
                >
                  {publishing === 'draft' ? 'Đang lưu...' : 'Lưu nháp'}
                </button>
                <button
                  onClick={() => handlePublish('published')}
                  disabled={!!publishing}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {publishing === 'published' ? 'Đang publish...' : 'Publish ngay'}
                </button>
              </div>
            </>
          ) : item.post_id ? (
            <Link
              href={`/admin/posts/${item.post_id}/edit`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Mở bài viết →
            </Link>
          ) : (
            <span className="text-sm text-slate-400">Đã xử lý</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CrawlerPage() {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<CrawledItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [preview, setPreview] = useState<CrawledItem | null>(null);

  const load = useCallback(async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await clientFetch<{ success: boolean; data: Pagination<CrawledItem> }>(
        `/admin/crawler?page=${p}`
      );
      setItems(res.data.data);
      setPage(res.data.current_page);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
    } catch {
      toastError('Không thể tải danh sách');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleCrawl = async () => {
    if (!url.trim()) return;
    setIsCrawling(true);
    try {
      const res = await clientFetch<{ success: boolean; data: CrawledItem; updated?: boolean }>(
        '/admin/crawler',
        { method: 'POST', body: JSON.stringify({ url: url.trim() }) }
      );
      setUrl('');
      if (res.updated) {
        success('URL đã tồn tại — đã cập nhật thời gian');
        setItems((prev) => [res.data, ...prev.filter((i) => i.id !== res.data.id)]);
      } else {
        success('Crawl thành công!');
        setItems((prev) => [res.data, ...prev]);
        setTotal((t) => t + 1);
      }
      setPreview(res.data);
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Crawl thất bại');
    } finally {
      setIsCrawling(false);
    }
  };

  const handlePublish = async (id: number, status: 'draft' | 'published') => {
    try {
      await clientFetch(`/admin/crawler/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      success(status === 'published' ? 'Đã publish bài viết!' : 'Đã lưu nháp!');
      setItems((prev) =>
        prev.map((item) => item.id === id ? { ...item, status: 'published' } : item)
      );
      setPreview((p) => p?.id === id ? { ...p, status: 'published' } : p);
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Thất bại');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await clientFetch(`/admin/crawler/${id}`, { method: 'DELETE' });
      success('Đã xóa tin');
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((t) => t - 1);
      setPreview(null);
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Thất bại');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onPublish={handlePublish}
          onReject={handleReject}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crawl tin tức</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {total} tin đã crawl
          </p>
        </div>
      </div>

      {/* URL input */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Crawl URL mới
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCrawl()}
            placeholder="https://vieclam.net/... hoặc bất kỳ trang nào"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            onClick={handleCrawl}
            disabled={isCrawling || !url.trim()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isCrawling ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Đang crawl...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Crawl
              </>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="mb-3 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-sm">Chưa có tin nào được crawl</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition cursor-pointer"
                onClick={() => setPreview(item)}
              >
                {/* Thumbnail */}
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="h-14 w-20 flex-shrink-0 rounded-lg object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="h-14 w-20 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {item.title ?? '(Không có tiêu đề)'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{item.source_url}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(item.updated_at).toLocaleString('vi-VN')}
                  </p>
                </div>

                {/* Status badge */}
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.status === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : item.status === 'rejected'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {item.status === 'published' ? 'Đã publish'
                    : item.status === 'rejected' ? 'Đã xóa'
                    : 'Chờ xử lý'}
                </span>

                {/* Arrow */}
                <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 p-4 dark:border-slate-700">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
            >
              ← Trước
            </button>
            <span className="text-sm text-slate-500">Trang {page}/{lastPage}</span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= lastPage}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300"
            >
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
