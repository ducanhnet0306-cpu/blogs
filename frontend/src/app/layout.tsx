import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import Link from 'next/link';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'EnterpriseBlog',
    template: '%s | EnterpriseBlog',
  },
  description: 'Blog doanh nghiệp chuyên nghiệp - chia sẻ kiến thức, kinh nghiệm và công nghệ',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'EnterpriseBlog',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={geist.className}>
      <body className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">{children}</main>

              <footer className="mt-auto border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mx-auto max-w-6xl px-4 py-12">
                  <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
                    <div className="sm:col-span-2">
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        EnterpriseBlog
                      </span>
                      <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        Nơi chia sẻ kiến thức, kinh nghiệm và câu chuyện từ đội ngũ chuyên gia. Cập nhật mỗi ngày.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Điều hướng
                      </h4>
                      <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                        {[
                          { href: '/blog', label: 'Blog' },
                          { href: '/categories', label: 'Danh mục' },
                          { href: '/tags', label: 'Tags' },
                        ].map(({ href, label }) => (
                          <li key={href}>
                            <Link href={href} className="transition hover:text-blue-600 dark:hover:text-blue-400">
                              {label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Tài khoản
                      </h4>
                      <ul className="mt-4 space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                        {[
                          { href: '/auth/login', label: 'Đăng nhập' },
                          { href: '/auth/register', label: 'Đăng ký' },
                          { href: '/admin', label: 'Admin Panel' },
                        ].map(({ href, label }) => (
                          <li key={href}>
                            <Link href={href} className="transition hover:text-blue-600 dark:hover:text-blue-400">
                              {label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-400 dark:border-slate-800 sm:flex-row">
                    <p>© 2026 EnterpriseBlog. All rights reserved.</p>
                    <p>Built with Next.js &amp; Laravel</p>
                  </div>
                </div>
              </footer>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
