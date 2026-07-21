'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Film, Menu, X, Settings, Ticket, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/axios';
import type { Booking } from '@/types/api';
import { toast } from '@/store/useToastStore';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[] | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleSearchTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone || searchPhone.length < 9) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก');
      return;
    }

    setSearching(true);
    try {
      const { data } = await apiClient.get<Booking[]>('/api/bookings', {
        params: { phoneNumber: searchPhone.trim() },
      });
      setMyBookings(data);
      if (data.length === 0) {
        toast.info('ไม่พบข้อมูลการจองสำหรับเบอร์โทรศัพท์นี้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการค้นหาตั๋ว');
    } finally {
      setSearching(false);
    }
  };

  const navLinks = [{ href: '/', label: 'หน้าแรก' }];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'glass border-b border-surface-border shadow-lg shadow-black/20'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/30 group-hover:scale-110 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white font-prompt hidden sm:block">
                Nature <span className="text-brand-red">MiniPlex</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                      : 'text-muted-foreground hover:text-white hover:bg-surface-elevated'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={() => {
                  setTicketModalOpen(true);
                  setMyBookings(null);
                  setSearchPhone('');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-red bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red hover:text-white transition-all shadow-sm"
              >
                <Ticket className="w-4 h-4" />
                <span>ค้นหาตั๋วของฉัน</span>
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-surface-elevated transition-all"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-surface-elevated transition-all"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 animate-fade-in">
              <div className="glass rounded-xl p-2 mt-2 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                      pathname === link.href
                        ? 'bg-brand-red text-white'
                        : 'text-muted-foreground hover:text-white hover:bg-surface-elevated'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setTicketModalOpen(true);
                    setMyBookings(null);
                    setSearchPhone('');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all"
                >
                  <Ticket className="w-4 h-4" />
                  <span>ค้นหาตั๋วของฉัน</span>
                </button>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-surface-elevated transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Ticket Lookup Dialog */}
      <Dialog open={ticketModalOpen} onOpenChange={setTicketModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Ticket className="w-5 h-5 text-brand-red" />
              ค้นหาตั๋ว E-Ticket ของคุณ
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSearchTickets} className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="lookup-phone" className="text-xs font-semibold text-gray-300">
                กรอกเบอร์โทรศัพท์ที่ใช้จองตั๋ว:
              </label>
              <div className="flex gap-2">
                <Input
                  id="lookup-phone"
                  type="tel"
                  placeholder="0891234567"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  maxLength={10}
                  className="bg-gray-800 border-gray-700 text-white h-11 focus-visible:ring-brand-red"
                />
                <Button type="submit" disabled={searching} className="bg-brand-red hover:bg-brand-red-dark text-white px-5 h-11 font-bold">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </form>

          {myBookings && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <p className="text-xs text-gray-400 font-semibold border-b border-gray-800 pb-2">
                พบ {myBookings.length} รายการจอง
              </p>

              {myBookings.map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-gray-800/80 border border-gray-700/80 flex items-center justify-between">
                  <div>
                    <code className="text-xs text-brand-red font-mono font-bold block">
                      #{b.id.slice(0, 8)}
                    </code>
                    <span className="text-[11px] text-gray-400">
                      {new Date(b.bookingTime).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setTicketModalOpen(false);
                      router.push(`/booking-confirmation/${b.id}`);
                    }}
                    className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-3 py-1 h-8 rounded-lg"
                  >
                    เปิดตั๋ว E-Ticket
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
