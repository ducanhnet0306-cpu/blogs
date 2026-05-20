import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold text-blue-600/20 dark:text-blue-400/20 select-none">
        404
      </p>
      <h1 className="-mt-4 text-2xl font-bold text-slate-900 dark:text-white">
        Không tìm thấy trang
      </h1>
      <p className="mt-2 max-w-sm text-slate-500 dark:text-slate-400">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Về trang chủ
        </Link>
        <Link
          href="/blog"
          className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Xem Blog
        </Link>
      </div>
    </div>
  );
}
