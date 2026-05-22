'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clientFetch } from '@/lib/clientApi';
import type { Post, PaginatedResponse, ApiListResponse, Category, Tag } from '@/types';

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [postsRes, allPostsRes, catsRes, tagsRes] = await Promise.all([
          clientFetch<PaginatedResponse<Post>>('/admin/posts?per_page=5&sort=created_at&order=desc'),
          clientFetch<PaginatedResponse<Post>>('/admin/posts?per_page=1'),
          clientFetch<ApiListResponse<Category>>('/admin/categories'),
          clientFetch<ApiListResponse<Tag>>('/admin/tags'),
        ]);

        setRecentPosts(postsRes.data);

        const allPosts = allPostsRes.meta?.total ?? 0;
        const published = postsRes.data.filter(p => p.status === 'published').length;

        setStats({
          totalPosts: allPosts,
          publishedPosts: published,
          draftPosts: allPosts - published,
          totalCategories: catsRes.data?.length ?? 0,
          totalTags: tagsRes.data?.length ?? 0,
          totalViews: postsRes.data.reduce((sum, p) => sum + (p.view_count ?? 0), 0),
        });
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      label: 'Tổng bài viết',
      value: stats?.totalPosts ?? '—',
      href: '/admin/posts',
      color: 'bg-blue-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Đã xuất bản',
      value: stats?.publishedPosts ?? '—',
      href: '/admin/posts?status=published',
      color: 'bg-emerald-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Danh mục',
      value: stats?.totalCategories ?? '—',
      href: '/admin/categories',
      color: 'bg-violet-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Tags',
      value: stats?.totalTags ?? '—',
      href: '/admin/tags',
      color: 'bg-amber-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Tổng quan hệ thống
          </p>
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

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, href, color, icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" /> : value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { href: '/admin/posts/new', label: 'Tạo bài viết mới', desc: 'Viết và xuất bản bài viết', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
          { href: '/admin/categories', label: 'Quản lý danh mục', desc: 'Thêm, sửa, xóa danh mục', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
          { href: '/admin/users', label: 'Quản lý người dùng', desc: 'Xem và quản lý tài khoản', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
        ].map(({ href, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 ${color}`}
          >
            <p className="font-semibold">{label}</p>
            <p className="mt-0.5 text-xs opacity-70">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent posts */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Bài viết gần đây</h2>
          <Link
            href="/admin/posts"
            className="text-sm text-blue-600 transition hover:underline dark:text-blue-400"
          >
            Xem tất cả →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : recentPosts.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">Chưa có bài viết nào</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="truncate text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <StatusBadge status={post.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    archived: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  };
  const labels: Record<string, string> = {
    published: 'Đã xuất bản',
    draft: 'Nháp',
    archived: 'Lưu trữ',
  };
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.draft}`}>
      {labels[status] ?? status}
    </span>
  );
}
