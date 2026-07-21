'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/axios';
import type { Booking } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from '@/store/useToastStore';
import { confirmModal } from '@/store/useConfirmStore';
import axios from 'axios';
import { Search, Loader2, BookOpen, XCircle, Trash2, Ticket } from 'lucide-react';
import Link from 'next/link';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { formatDateTime } from '@/lib/utils';

export default function AdminBookingsPage() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(bookings.length / pageSize) || 1;
  const paginatedBookings = bookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fetchBookings = useCallback(async (searchParam?: string) => {
    setSearching(true);
    try {
      const { data } = await apiClient.get<Booking[]>('/api/bookings', {
        params: { phoneNumber: searchParam || undefined },
      });
      setBookings(data);
      setSearchPhone(searchParam || '');
      if (searchParam && !data.length) {
        toast.info('ไม่พบการจองสำหรับเบอร์โทรนี้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการจอง');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        setSearching(true);
        const { data } = await apiClient.get<Booking[]>('/api/bookings');
        if (!ignore) {
          setBookings(data);
          setSearching(false);
        }
      } catch {
        if (!ignore) {
          toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการจอง');
          setSearching(false);
        }
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = () => {
    void fetchBookings(phone.trim());
  };

  const handleCancelClick = (b: Booking, itemId?: string, seatName?: string) => {
    const isSingleItem = Boolean(itemId);
    const targetLabel = isSingleItem
      ? `ที่นั่ง ${seatName ?? ''}`
      : `การจองรหัส #${b.id.slice(0, 8)}`;

    const phoneForCancel = b.customer?.phoneNumber ?? searchPhone;

    confirmModal({
      title: isSingleItem ? 'ยืนยันการยกเลิกที่นั่ง' : 'ยืนยันการยกเลิกการจองทั้งตั๋ว',
      description: `คุณแน่ใจหรือไม่ที่จะยกเลิก ${targetLabel}?`,
      confirmText: 'ยกเลิกรายการ',
      cancelText: 'ย้อนกลับ',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          if (itemId) {
            await apiClient.delete(
              `/api/bookings/${b.id}/items/${itemId}`,
              { params: { phoneNumber: phoneForCancel } }
            );
            toast.success(`ยกเลิก${targetLabel} เรียบร้อยแล้ว`);
          } else {
            await apiClient.delete(`/api/bookings/${b.id}`, {
              params: { phoneNumber: phoneForCancel },
            });
            toast.success('ยกเลิกการจองทั้งตั๋วเรียบร้อยแล้ว');
          }

          // Refresh list
          void fetchBookings(searchPhone);
        } catch (error) {
          toast.error(
            axios.isAxiosError(error)
              ? (error.response?.data?.message ?? 'ไม่สามารถยกเลิกได้')
              : 'เกิดข้อผิดพลาดในการยกเลิก'
          );
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-brand-red" />
          <h1 className="text-2xl font-bold text-white font-prompt">จัดการการจองตั๋ว</h1>
        </div>
      </div>

      <div className="flex gap-3 max-w-md">
        <Input
          type="tel"
          placeholder="ค้นหาด้วยเบอร์โทรศัพท์ (เว้นว่างเพื่อดูทั้งหมด)..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-surface-elevated border-surface-border text-white placeholder:text-muted-foreground focus-visible:ring-brand-red"
          maxLength={10}
        />
        <Button onClick={handleSearch} disabled={searching}
          className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20 font-bold">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {bookings.length > 0 ? (
        <div className="rounded-2xl border border-surface-border bg-surface-DEFAULT overflow-hidden shadow-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-surface-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Booking ID</TableHead>
                <TableHead className="text-muted-foreground">เบอร์โทรศัพท์</TableHead>
                <TableHead className="text-muted-foreground">เวลาจอง</TableHead>
                <TableHead className="text-muted-foreground">สถานะตั๋ว</TableHead>
                <TableHead className="text-muted-foreground">รายการที่นั่ง</TableHead>
                <TableHead className="text-right text-muted-foreground">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.map((b) => {
                const phoneNumber = b.customerPhoneNumber || b.customer?.phoneNumber || '-';
                const isCompleted = b.status === 'Completed' || String(b.status) === '0';

                return (
                  <TableRow key={b.id} className="border-surface-border hover:bg-surface-elevated transition-colors">
                    <TableCell className="text-white font-mono text-xs font-semibold">{b.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-white font-mono font-medium">{phoneNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDateTime(b.bookingTime)}</TableCell>
                    <TableCell>
                      <Badge className={isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-destructive/20 text-destructive border-destructive/30'}>
                        {isCompleted ? 'Completed' : 'Canceled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {b.bookingItems?.map((item) => {
                          const seatLabel = item.seatName || (item.seat ? `${item.seat.columnName}${item.seat.rowName}` : `ที่นั่ง #${item.seatId}`);
                          const isActive = item.itemStatus === 'Active' || String(item.itemStatus) === '0';

                          return (
                            <div key={item.id} className="flex items-center gap-1">
                              <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                                isActive
                                  ? 'bg-brand-red/10 text-brand-red border-brand-red/30'
                                  : 'bg-surface-elevated text-muted-foreground border-surface-border line-through opacity-60'
                              }`}>
                                {seatLabel}
                              </span>
                              {isActive && isCompleted && (
                                <button
                                  onClick={() => handleCancelClick(b, item.id, seatLabel)}
                                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                  title={`ยกเลิกที่นั่ง ${seatLabel}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/booking-confirmation/${b.id}`} target="_blank">
                          <Button size="sm" variant="outline" className="border-surface-border text-xs text-muted-foreground hover:text-white">
                            <Ticket className="w-3.5 h-3.5 mr-1 text-brand-red" />
                            เปิด E-Ticket
                          </Button>
                        </Link>
                        {isCompleted && (
                          <Button size="sm" variant="ghost"
                            onClick={() => handleCancelClick(b)}
                            title="ยกเลิกการจองทั้งตั๋ว"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Shadcn UI Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-surface-border bg-surface-DEFAULT flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">
                แสดงการจอง {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, bookings.length)} จากทั้งหมด {bookings.length} รายการ
              </span>
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      ) : (
        !searching && (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3 bg-surface-DEFAULT rounded-2xl border border-surface-border">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p>ไม่พบรายการจองตั๋วในระบบ</p>
          </div>
        )
      )}
    </div>
  );
}
