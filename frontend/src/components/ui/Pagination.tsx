import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  buildHref: (page: number) => string;
}

export function Pagination({ currentPage, lastPage, buildHref }: PaginationProps) {
  if (lastPage <= 1) return null;

  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Phân trang">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Trang trước"
        >
          ← Trước
        </Link>
      )}

      {pages.map((p) => {
        const dist = Math.abs(p - currentPage);
        const isEdge = p === 1 || p === lastPage;
        const show = dist <= 1 || isEdge;
        const isDot =
          (p === 2 && currentPage > 3) || (p === lastPage - 1 && currentPage < lastPage - 2);

        if (!show && !isDot) return null;
        if (isDot && !show) {
          return (
            <span key={p} className="select-none px-1 text-slate-400">
              …
            </span>
          );
        }

        const isCurrent = p === currentPage;
        return (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={isCurrent ? 'page' : undefined}
            className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
              isCurrent
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </Link>
        );
      })}

      {currentPage < lastPage && (
        <Link
          href={buildHref(currentPage + 1)}
          className="flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Trang sau"
        >
          Sau →
        </Link>
      )}
    </nav>
  );
}
