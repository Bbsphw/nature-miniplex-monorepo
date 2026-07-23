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
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Search, Loader2, BookOpen, XCircle, Trash2, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminBookingsPage() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Phone Verification Modal State (SRS Requirement)
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ b: Booking; itemId?: string; seatName?: string } | null>(null);
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const [canceling, setCanceling] = useState(false);

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
        toast.info('ไม่พบรายการจองตั๋วสำหรับเบอร์โทรศัพท์นี้');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการจองตั๋ว');
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
          toast.error('เกิดข้อผิดพลาดในการดึงข้อมูลการจองตั๋ว');
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

  const openCancelModal = (b: Booking, itemId?: string, seatName?: string) => {
    setCancelTarget({ b, itemId, seatName });
    setVerifyPhoneInput('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const cleanInput = verifyPhoneInput.trim();
    if (!cleanInput) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ 10 หลักเพื่อยืนยันตัวตน');
      return;
    }

    setCanceling(true);
    const { b, itemId, seatName } = cancelTarget;
    const isSingleItem = Boolean(itemId);
    const targetLabel = isSingleItem ? `ที่นั่ง ${seatName ?? ''}` : `รายการจองตั๋ว #${b.id.slice(0, 8)}`;

    try {
      if (itemId) {
        await apiClient.delete(`/api/bookings/${b.id}/items/${itemId}`, {
          params: { phoneNumber: cleanInput },
        });
        toast.success(`ยกเลิก${targetLabel} เรียบร้อยแล้ว`);
      } else {
        await apiClient.delete(`/api/bookings/${b.id}`, {
          params: { phoneNumber: cleanInput },
        });
        toast.success('ยกเลิกรายการจองตั๋วเรียบร้อยแล้ว');
      }

      setCancelModalOpen(false);
      setCancelTarget(null);
      void fetchBookings(searchPhone);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: string; message?: string; title?: string })?.detail ??
          (error.response?.data as { detail?: string; message?: string; title?: string })?.message ??
          (error.response?.data as { detail?: string; message?: string; title?: string })?.title ??
          'เกิดข้อผิดพลาดในการยกเลิก'
        : 'เกิดข้อผิดพลาดในการยกเลิก';
      toast.error(message);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <PermissionGuard requiredPermissions={['bookings:read:assigned_cinema', 'bookings:read:all', 'bookings:cancel:assigned_cinema', 'bookings:cancel:any']} requireAll={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
            <div>
              <h1 className="text-2xl font-bold text-white font-prompt">จัดการรายการจองตั๋วภาพยนตร์</h1>
              <p className="text-xs text-gray-400">ค้นหาตามเบอร์โทรศัพท์ ตรวจสอบสถานะตั๋ว และออกเอกสาร E-Ticket</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 max-w-lg items-center">
          <div className="relative flex-1">
            <Input
              id="booking-search-phone"
              type="tel"
              aria-label="ค้นหาด้วยเบอร์โทรศัพท์"
              placeholder="ค้นหาด้วยเบอร์โทรศัพท์ (เว้นว่างเพื่อดูทั้งหมด)..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-[#0A0A0F] border-[#2A2A3E] text-white placeholder:text-gray-500 focus-visible:ring-brand-red text-xs font-mono pr-8"
              maxLength={10}
            />
            {phone && (
              <button
                type="button"
                onClick={() => { setPhone(''); void fetchBookings(''); }}
                aria-label="ล้างการค้นหา"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching}
            aria-label="ค้นหา"
            className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt shadow-[0_0_12px_rgba(227,24,55,0.25)] px-4"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
          {searchPhone && (
            <Button
              variant="outline"
              onClick={() => { setPhone(''); void fetchBookings(''); }}
              className="border-[#2A2A3E] bg-[#0A0A0F] text-gray-400 hover:text-white hover:bg-gray-800 text-xs font-prompt px-3"
            >
              ดูทั้งหมด
            </Button>
          )}
        </div>

        {/* Bookings Table with fixed min-height container */}
        {bookings.length > 0 ? (
          <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl min-h-[480px] flex flex-col justify-between">
            <div className="flex-1">
              <Table>
                <TableHeader className="bg-[#0A0A0F]/60 border-b border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-prompt">Booking ID</TableHead>
                    <TableHead className="text-gray-400 font-prompt">เบอร์โทรศัพท์</TableHead>
                    <TableHead className="text-gray-400 font-prompt">เวลาทำรายการ</TableHead>
                    <TableHead className="text-gray-400 font-prompt">สถานะตั๋ว</TableHead>
                    <TableHead className="text-gray-400 font-prompt">รายการที่นั่ง</TableHead>
                    <TableHead className="text-right text-gray-400 font-prompt">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.map((b) => {
                    const phoneNumber = b.customerPhoneNumber || b.customer?.phoneNumber || '-';
                    const isCompleted = b.status === 'Completed' || String(b.status) === '0';

                    return (
                      <TableRow key={b.id} className="border-[#2A2A3E] hover:bg-gray-800/40 transition-colors">
                        <TableCell className="text-white font-mono text-xs font-bold">{b.id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-white font-mono font-medium text-xs">{phoneNumber}</TableCell>
                        <TableCell className="text-gray-400 text-xs font-mono">{formatDateTime(b.bookingTime)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              isCompleted
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-prompt'
                                : 'bg-red-500/15 text-red-400 border-red-500/30 font-prompt'
                            }
                          >
                            {isCompleted ? 'Completed (สำเร็จ)' : 'Canceled (ยกเลิกแล้ว)'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {b.bookingItems?.map((item) => {
                              const seatLabel = item.seatName || (item.seat ? `${item.seat.columnName}${item.seat.rowName}` : `ที่นั่ง #${item.seatId}`);
                              const isActive = item.itemStatus === 'Active' || String(item.itemStatus) === '0';

                              return (
                                <div key={item.id} className="flex items-center gap-1">
                                  <span
                                    className={`text-xs px-2.5 py-1 rounded-xl font-bold font-mono border transition-all ${
                                      isActive
                                        ? 'bg-brand-red/15 text-brand-red border-brand-red/40 shadow-sm'
                                        : 'bg-gray-800/60 text-gray-500 border-gray-700 line-through opacity-60'
                                    }`}
                                  >
                                    {seatLabel}
                                  </span>
                                  {isActive && isCompleted && (
                                    <PermissionGuard requiredPermissions={['bookings:cancel:assigned_cinema', 'bookings:cancel:any']} requireAll={false}>
                                      <button
                                        type="button"
                                        onClick={() => openCancelModal(b, item.id, seatLabel)}
                                        className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                                        title={`ยกเลิกที่นั่ง ${seatLabel}`}
                                        aria-label={`ยกเลิกที่นั่ง ${seatLabel}`}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </PermissionGuard>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/booking-confirmation/${b.id}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#2A2A3E] bg-[#0A0A0F] text-xs text-gray-300 hover:text-white hover:bg-gray-800 font-prompt"
                              >
                                <Ticket className="w-3.5 h-3.5 mr-1 text-brand-red" />
                                เปิด E-Ticket
                              </Button>
                            </Link>
                            {isCompleted && (
                              <PermissionGuard requiredPermissions={['bookings:cancel:assigned_cinema', 'bookings:cancel:any']} requireAll={false}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openCancelModal(b)}
                                  title="ยกเลิกการจองทั้งตั๋ว"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs font-prompt"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  <span>ยกเลิกตั๋ว</span>
                                </Button>
                              </PermissionGuard>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Shadcn UI Pagination with smooth event handlers */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#2A2A3E] bg-[#0A0A0F]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-400">
                  แสดงการจอง {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, bookings.length)} จากทั้งหมด {bookings.length} รายการ
                </span>
                <Pagination className="w-auto mx-0">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        disabled={currentPage === 1}
                        className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          type="button"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          className={
                            currentPage === page
                              ? 'bg-brand-red text-white border-brand-red shadow-[0_0_10px_rgba(227,24,55,0.3)] cursor-default'
                              : 'border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer'
                          }
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                        disabled={currentPage === totalPages}
                        className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        ) : (
          !searching && (
            <div className="flex flex-col items-center py-24 text-gray-400 gap-3 bg-[#1C1C27] rounded-2xl border border-[#2A2A3E]">
              <BookOpen className="w-12 h-12 text-gray-600" />
              <p className="font-prompt text-gray-300">ไม่พบรายการจองตั๋วในระบบ</p>
            </div>
          )
        )}

        {/* Identity Verification Dialog (SRS Requirement) */}
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
          <DialogContent className="bg-[#1C1C27] border-[#2A2A3E] text-white sm:max-w-md">
            <DialogHeader className="border-b border-[#2A2A3E] pb-3">
              <DialogTitle className="text-lg font-bold text-white font-prompt flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                ยืนยันตัวตนเพื่อยกเลิกรายการจอง
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <p className="text-xs text-gray-300 font-prompt leading-relaxed">
                ตามข้อกำหนดความปลอดภัย SRS: การยกเลิกตั๋วหรือที่นั่ง ต้องระบุเบอร์โทรศัพท์ที่ใช้จองตั๋วใบนี้เพื่อยืนยันสิทธิ์ความเป็นเจ้าของ
              </p>

              {cancelTarget && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs space-y-1">
                  <div className="text-gray-300">
                    <span className="font-bold text-white">รายการที่ต้องการยกเลิก:</span>{' '}
                    <span className="text-brand-red font-bold">
                      {cancelTarget.itemId ? `ที่นั่ง ${cancelTarget.seatName}` : `ตั๋วทั้งใบ #${cancelTarget.b.id.slice(0, 8)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="verify-phone-input" className="text-xs font-bold text-gray-200 font-prompt">
                  เบอร์โทรศัพท์ 10 หลักของผู้จอง (Required):
                </label>
                <Input
                  id="verify-phone-input"
                  type="tel"
                  maxLength={10}
                  placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก (เช่น 0812345678)..."
                  value={verifyPhoneInput}
                  onChange={(e) => setVerifyPhoneInput(e.target.value)}
                  className="bg-[#0A0A0F] border-[#2A2A3E] text-white font-mono text-center text-lg tracking-widest focus-visible:ring-brand-red"
                  onKeyDown={(e) => e.key === 'Enter' && void handleConfirmCancel()}
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[#2A2A3E]">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={canceling}
                className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 font-prompt text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => void handleConfirmCancel()}
                disabled={canceling}
                className="bg-red-600 hover:bg-red-700 text-white font-bold font-prompt text-xs px-5 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              >
                {canceling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                ยืนยันการยกเลิกรายการ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}

