'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';
import type { Category, Tag, ApiListResponse } from '@/types';
import RichTextEditor from '@/components/editor/RichTextEditor';
import ThumbnailUploader from '@/components/editor/ThumbnailUploader';
import CrawlModal, { type CrawlResult } from '@/components/editor/CrawlModal';

const schema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Nội dung tối thiểu 10 ký tự'),
  thumbnail: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  is_featured: z.boolean(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  tag_ids: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function NewPostPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCrawlModal, setShowCrawlModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', is_featured: false, tag_ids: [] },
  });

  const selectedTagIds = watch('tag_ids');
  const thumbnail = watch('thumbnail') ?? '';

  useEffect(() => {
    Promise.all([
      clientFetch<ApiListResponse<Category>>('/admin/categories'),
      clientFetch<ApiListResponse<Tag>>('/admin/tags'),
    ]).then(([cats, tagsRes]) => {
      setCategories(cats.data ?? []);
      setTags(tagsRes.data ?? []);
    }).catch(() => {});
  }, []);

  const toggleTag = (id: string) => {
    const current = selectedTagIds ?? [];
    setValue(
      'tag_ids',
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  };

  const handleCrawlImport = (data: CrawlResult) => {
    if (data.title) setValue('title', data.title, { shouldValidate: true });
    if (data.excerpt) setValue('excerpt', data.excerpt);
    if (data.thumbnail) setValue('thumbnail', data.thumbnail);
    if (data.content) setValue('content', data.content, { shouldValidate: true });
    if (data.seo_title) setValue('seo_title', data.seo_title);
    if (data.seo_description) setValue('seo_description', data.seo_description);
    success('Đã import nội dung từ URL');
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await clientFetch('/admin/posts', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          category_id: data.category_id ? Number(data.category_id) : null,
          tag_ids: data.tag_ids.map(Number),
          thumbnail: data.thumbnail || null,
          seo: { title: data.seo_title, description: data.seo_description, keywords: data.seo_keywords },
        }),
      });
      success('Đã tạo bài viết thành công!');
      router.push('/admin/posts');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Tạo bài viết thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {showCrawlModal && (
        <CrawlModal onClose={() => setShowCrawlModal(false)} onImport={handleCrawlImport} />
      )}

      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/posts"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="flex-1 text-2xl font-bold text-slate-900 dark:text-white">Bài viết mới</h1>
        <button
          type="button"
          onClick={() => setShowCrawlModal(true)}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Import từ URL
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2/3 */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Excerpt */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tóm tắt
                </label>
                <textarea
                  {...register('excerpt')}
                  rows={2}
                  placeholder="Mô tả ngắn về bài viết..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Content */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={watch('content') ?? ''}
                  onChange={(val) => setValue('content', val, { shouldValidate: true })}
                  placeholder="Bắt đầu nhập nội dung bài viết..."
                  error={!!errors.content}
                />
                {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
              </div>

              {/* Thumbnail */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ảnh thumbnail
                </label>
                <ThumbnailUploader
                  value={thumbnail}
                  onChange={(url) => setValue('thumbnail', url)}
                  error={!!errors.thumbnail}
                />
                {errors.thumbnail && <p className="mt-1 text-xs text-red-500">{errors.thumbnail.message}</p>}
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">SEO Title</label>
                <input
                  {...register('seo_title')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">SEO Description</label>
                <textarea
                  {...register('seo_description')}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Keywords</label>
                <input
                  {...register('seo_keywords')}
                  placeholder="từ khóa, phân cách, bằng dấu phẩy"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-5">
          {/* Publish settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Xuất bản</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Trạng thái</label>
                <select
                  {...register('status')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value="draft">Nháp</option>
                  <option value="published">Xuất bản</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  {...register('is_featured')}
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Bài viết nổi bật</span>
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu bài'}
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Danh mục</h3>
            <select
              {...register('category_id')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">— Không chọn —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = selectedTagIds?.includes(String(tag.id));
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(String(tag.id))}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
