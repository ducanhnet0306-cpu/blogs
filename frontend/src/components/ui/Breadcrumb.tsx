import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="transition hover:text-blue-600 dark:hover:text-blue-400"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-700 dark:text-slate-300">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
