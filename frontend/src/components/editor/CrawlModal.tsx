'use client';

import { useState } from 'react';
import { clientFetch } from '@/lib/clientApi';

export interface CrawlResult {
  title: string;
  excerpt: string;
  thumbnail: string;
  content: string;
  seo_title: string;
  seo_description: string;
  source_url: string;
}

interface Props {
  onClose: () => void;
  onImport: (data: CrawlResult) => void;
}

export default function CrawlModal({ onClose, onImport }: Props) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState({
    title: true, excerpt: true, thumbnail: true, content: true,
    seo_title: true, seo_description: true,
  });

  const handleFetch = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await clientFetch<{ success: boolean; data: CrawlResult }>('/admin/crawler/fetch', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      });
      setResult(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể crawl URL này');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!result) return;
    onImport({
      title: selected.title ? result.title : '',
      excerpt: selected.excerpt ? result.excerpt : '',
      thumbnail: selected.thumbnail ? result.thumbnail : '',
      content: selected.content ? result.content : '',
      seo_title: selected.seo_title ? result.seo_title : '',
      seo_description: selected.seo_description ? result.seo_description : '',
      source_url: result.source_url,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Import từ URL</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Nhập link trang web để tự động lấy nội dung về
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              placeholder="https://example.com/bai-viet-abc"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              onClick={handleFetch}
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? (
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

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Chọn trường muốn import:
              </p>

              {([
                { key: 'title', label: 'Tiêu đề', value: result.title },
                { key: 'excerpt', label: 'Tóm tắt', value: result.excerpt },
                { key: 'thumbnail', label: 'Ảnh thumbnail', value: result.thumbnail },
                { key: 'seo_title', label: 'SEO Title', value: result.seo_title },
                { key: 'seo_description', label: 'SEO Description', value: result.seo_description },
              ] as const).map(({ key, label, value }) => value ? (
                <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                  <input
                    type="checkbox"
                    checked={selected[key]}
                    onChange={(e) => setSelected((s) => ({ ...s, [key]: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{value}</p>
                  </div>
                </label>
              ) : null)}

              {result.content && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                  <input
                    type="checkbox"
                    checked={selected.content}
                    onChange={(e) => setSelected((s) => ({ ...s, content: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Nội dung (HTML)</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {result.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 150)}...
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {result && (
          <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-700">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Hủy
            </button>
            <button
              onClick={handleImport}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Import vào bài viết
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
