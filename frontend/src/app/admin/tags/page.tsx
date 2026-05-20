'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import type { Tag, ApiListResponse, ApiResponse } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Tên tag không được để trống'),
});

type FormData = z.infer<typeof schema>;

export default function AdminTagsPage() {
  const { success, error: toastError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await clientFetch<ApiListResponse<Tag>>('/admin/tags');
      setTags(res.data ?? []);
    } catch {
      toastError('Không thể tải tags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: '' });
    setModalOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditTarget(tag);
    reset({ name: tag.name });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await clientFetch<ApiResponse<Tag>>(`/admin/tags/${editTarget.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        success('Đã cập nhật tag');
      } else {
        await clientFetch<ApiResponse<Tag>>('/admin/tags', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        success('Đã tạo tag mới');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await clientFetch(`/admin/tags/${deleteTarget.id}`, { method: 'DELETE' });
      success('Đã xóa tag');
      setDeleteTarget(null);
      load();
    } catch {
      toastError('Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tags</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{tags.length} tags</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm tag
        </button>
      </div>

      {/* Tags grid */}
      {isLoading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p className="text-slate-400">Chưa có tag nào</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Tên tag</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Slug</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Bài viết</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      #{tag.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{tag.slug}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {tag.posts_count ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(tag)}
                        className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tag)}
                        className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Sửa tag' : 'Thêm tag mới'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tên tag <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="Ví dụ: nextjs, laravel, react..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa tag"
        description={`Bạn có chắc muốn xóa tag "#${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
