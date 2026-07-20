'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Film,
  Clock,
  BookOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/admin/movies', label: 'ภาพยนตร์', icon: Film },
  { href: '/admin/showtimes', label: 'รอบฉาย', icon: Clock },
  { href: '/admin/bookings', label: 'การจอง', icon: BookOpen },
  { href: '/admin/reports', label: 'รายงาน', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const username = useAuthStore((state) => state.username);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-surface-DEFAULT border-r border-surface-border transition-transform duration-300 md:translate-x-0 md:static md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
          <div className="w-9 h-9 rounded-lg bg-brand-red flex items-center justify-center flex-shrink-0">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm font-prompt">Nature MiniPlex</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  active
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                    : 'text-muted-foreground hover:text-white hover:bg-surface-elevated'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-elevated mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-red font-bold text-sm">
              {username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{username}</p>
              <Badge
                variant="outline"
                className="text-[10px] border-brand-red/30 text-brand-red px-1.5 py-0"
              >
                {role}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-surface-elevated transition-all"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-DEFAULT">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-surface-elevated"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-white text-sm font-prompt">Admin Panel</span>
        </div>

        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
