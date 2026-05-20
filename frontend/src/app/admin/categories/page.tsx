'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import type { Category, ApiListResponse, ApiResponse } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  description: z.string().optional(),
  status: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { status: true } });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await clientFetch<ApiListResponse<Category>>('/admin/categories');
      setCategories(res.data ?? []);
    } catch {
      toastError('Không thể tải danh mục');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: '', description: '', status: true });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    reset({ name: cat.name, description: cat.description ?? '', status: cat.status });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await clientFetch<ApiResponse<Category>>(`/admin/categories/${editTarget.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        success('Đã cập nhật danh mục');
      } else {
        await clientFetch<ApiResponse<Category>>('/admin/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        success('Đã tạo danh mục mới');
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
      await clientFetch(`/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
      success('Đã xóa danh mục');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Danh mục</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{categories.length} danh mục</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm danh mục
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Tên</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 md:table-cell">Slug</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 lg:table-cell">Mô tả</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Trạng thái</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                    </td>
                  ))}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  Chưa có danh mục nào
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{cat.name}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 md:table-cell">{cat.slug}</td>
                  <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 lg:table-cell">
                    <span className="line-clamp-1">{cat.description ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cat.status
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {cat.status ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                        title="Sửa"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        title="Xóa"
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Sửa danh mục' : 'Thêm danh mục mới'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Mô tả</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              {...register('status')}
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Kích hoạt danh mục</span>
          </label>

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
        title="Xóa danh mục"
        description={`Bạn có chắc muốn xóa danh mục "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
