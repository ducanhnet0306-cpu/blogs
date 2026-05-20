'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';
import type { Post, Category, Tag, ApiResponse, ApiListResponse } from '@/types';
import RichTextEditor from '@/components/editor/RichTextEditor';

const schema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Nội dung tối thiểu 10 ký tự'),
  thumbnail: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
  category_id: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  is_featured: z.boolean(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  tag_ids: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'draft', is_featured: false, tag_ids: [] },
  });

  const selectedTagIds = watch('tag_ids');

  useEffect(() => {
    const load = async () => {
      try {
        const [postRes, catsRes, tagsRes] = await Promise.all([
          clientFetch<ApiResponse<Post>>(`/admin/posts/${params.id}`),
          clientFetch<ApiListResponse<Category>>('/admin/categories'),
          clientFetch<ApiListResponse<Tag>>('/admin/tags'),
        ]);

        const post = postRes.data;
        setCategories(catsRes.data ?? []);
        setTags(tagsRes.data ?? []);

        reset({
          title: post.title,
          excerpt: post.excerpt ?? '',
          content: post.content,
          thumbnail: post.thumbnail ?? '',
          category_id: post.category ? String(post.category.id) : '',
          status: post.status,
          is_featured: post.is_featured,
          seo_title: post.seo?.title ?? '',
          seo_description: post.seo?.description ?? '',
          seo_keywords: post.seo?.keywords ?? '',
          tag_ids: post.tags?.map((t) => String(t.id)) ?? [],
        });
      } catch {
        toastError('Không thể tải bài viết');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [params.id]);

  const toggleTag = (id: string) => {
    const current = selectedTagIds ?? [];
    setValue(
      'tag_ids',
      current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    );
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await clientFetch(`/admin/posts/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          category_id: data.category_id ? Number(data.category_id) : null,
          tag_ids: data.tag_ids.map(Number),
          thumbnail: data.thumbnail || null,
          seo: { title: data.seo_title, description: data.seo_description, keywords: data.seo_keywords },
        }),
      });
      success('Đã cập nhật bài viết!');
      router.push('/admin/posts');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/posts"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sửa bài viết</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tóm tắt</label>
                <textarea
                  {...register('excerpt')}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

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

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">URL ảnh thumbnail</label>
                <input
                  {...register('thumbnail')}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {errors.thumbnail && <p className="mt-1 text-xs text-red-500">{errors.thumbnail.message}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">SEO Title</label>
                <input
                  {...register('seo_title')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">SEO Description</label>
                <textarea
                  {...register('seo_description')}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Keywords</label>
                <input
                  {...register('seo_keywords')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
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
                {isSubmitting ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>

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
