'use client';

import { useEffect, useState, useCallback } from 'react';
import { clientFetch } from '@/lib/clientApi';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ui/Modal';
import type { User, PaginatedResponse } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  banned: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  banned: 'Bị khóa',
};

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await clientFetch<PaginatedResponse<User>>('/admin/users?per_page=50');
      setUsers(res.data);
      setTotal(res.meta?.total ?? 0);
    } catch {
      toastError('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (user: User, newStatus: string) => {
    setUpdatingStatus(user.id);
    try {
      await clientFetch(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      success(`Đã cập nhật trạng thái người dùng`);
      load();
    } catch {
      toastError('Cập nhật thất bại');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await clientFetch(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      success('Đã xóa người dùng');
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Người dùng</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{total} tài khoản</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Người dùng</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 md:table-cell">Email</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 lg:table-cell">Vai trò</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    Chưa có người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 md:table-cell">
                      {user.email}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role) => (
                          <span
                            key={role.id}
                            className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          >
                            {role.name}
                          </span>
                        )) ?? <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.status}
                        disabled={updatingStatus === user.id}
                        onChange={(e) => handleStatusChange(user, e.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer disabled:opacity-60 ${STATUS_COLORS[user.status] ?? STATUS_COLORS.inactive}`}
                      >
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="banned">Bị khóa</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDeleteTarget(user)}
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
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa người dùng"
        description={`Bạn có chắc muốn xóa tài khoản "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
