'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Film,
  Clock,
  Ticket,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  Users,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { useFilteredNavItems } from '@/hooks/useFilteredNavItems';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const username = useAuthStore((state) => state.username);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === '/admin/login';

  const { filteredNavGroups, isHydrated } = useFilteredNavItems();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-surface-DEFAULT border-r border-surface-border transition-transform duration-300 md:translate-x-0 md:static md:z-auto shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-border bg-gradient-to-r from-gray-900 via-gray-900 to-red-950/20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-brand-red/30 border border-brand-red/40">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-white text-sm font-prompt tracking-wide truncate">Nature MiniPlex</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="SSOT Active" />
            </div>
            <p className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">Enterprise RBAC Panel</p>
          </div>
        </div>

        {/* Categorized Navigation Menu (Dynamically Filtered via Zustand Permissions) */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {!isHydrated ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2 text-xs font-prompt">
              <Loader2 className="w-4 h-4 animate-spin text-brand-red" />
              <span>กำลังโหลดสิทธิ์ระบบ...</span>
            </div>
          ) : (
            filteredNavGroups.map((group, groupIdx) => (
              <div key={group.category} className={cn('space-y-1', groupIdx > 0 && 'pt-2 border-t border-surface-border/60')}>
                <div className="px-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-prompt block">
                    {group.category}
                  </span>
                </div>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative',
                        active
                          ? 'bg-brand-red text-white shadow-md shadow-brand-red/25 font-bold'
                          : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110', active ? 'text-white' : 'text-gray-400 group-hover:text-brand-red')} />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-prompt">{item.label}</span>
                      </div>
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-white opacity-80" />}
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        {/* Sidebar Footer User Profile Info */}
        <div className="p-3 border-t border-surface-border bg-surface-elevated/40">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border/60 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-red/20 border border-brand-red/40 flex items-center justify-center text-brand-red font-bold text-xs font-prompt flex-shrink-0 shadow-inner">
              {username?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate font-prompt">{username}</p>
              <Badge
                variant="outline"
                className="text-[9px] border-brand-red/40 text-brand-red bg-brand-red/10 px-1.5 py-0 font-mono"
              >
                {role}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-all font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ (Logout)</span>
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
