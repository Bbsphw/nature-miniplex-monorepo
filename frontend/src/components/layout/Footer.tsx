'use client';

import Link from 'next/link';
import { Film } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-surface-DEFAULT border-t border-surface-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white font-prompt">
              Nature <span className="text-brand-red">MiniPlex</span>
            </span>
          </Link>

          <p className="text-muted-foreground text-sm text-center">
            © {new Date().getFullYear()} Nature MiniPlex · โรงหนังศรีราชา &amp; บางแสน
          </p>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>โรงหนังศรีราชา</span>
            <span className="text-surface-border">|</span>
            <span>โรงหนังบางแสน</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
