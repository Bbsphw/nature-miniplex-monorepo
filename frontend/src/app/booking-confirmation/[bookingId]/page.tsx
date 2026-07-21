"use client";

import { useState, use } from "react";
import { useBookingById } from "@/features/bookings/hooks/useBookingById";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import axios from "axios";
import apiClient from "@/lib/axios";
import type { BookingItem } from "@/types/api";
import {
  CheckCircle2,
  Ticket,
  MapPin,
  Clock,
  Phone,
  Mail,
  Hash,
  Loader2,
  XCircle,
  ArrowLeft,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const { data: booking, isPending, refetch } = useBookingById(bookingId);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelingItem, setCancelingItem] = useState<BookingItem | null>(null);
  const [cancelPhone, setCancelPhone] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Cancel Entire Booking
  const handleCancelClick = () => {
    if (!cancelPhone) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ที่ใช้จองก่อนยืนยัน");
      return;
    }

    confirmModal({
      title: "ยืนยันการยกเลิกการจองทั้งหมด",
      description: `คุณแน่ใจหรือไม่ที่จะยกเลิกการจองตั๋วทุกใบในรหัส #${bookingId.slice(0, 8)}?`,
      confirmText: "ยืนยันยกเลิกทุกที่นั่ง",
      cancelText: "ย้อนกลับ",
      variant: "destructive",
      onConfirm: async () => {
        setCancelling(true);
        try {
          await apiClient.delete(`/api/bookings/${bookingId}`, {
            params: { phoneNumber: cancelPhone },
          });
          toast.success("ยกเลิกการจองตั๋วภาพยนตร์เรียบร้อยแล้ว");
          setCancelOpen(false);
          void refetch();
        } catch (error) {
          if (axios.isAxiosError(error)) {
            toast.error(
              error.response?.data?.message ??
                "ไม่สามารถยกเลิกได้ กรุณาตรวจสอบเบอร์โทรศัพท์",
            );
          } else {
            toast.error("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
          }
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  // Cancel Single Seat Item
  const handleCancelSingleSeat = (item: BookingItem) => {
    const seatName = item.seat ? `${item.seat.columnName}${item.seat.rowName}` : 'ที่นั่งนี้';

    confirmModal({
      title: `ยืนยันการยกเลิกที่นั่ง ${seatName}`,
      description: `คุณแน่ใจหรือไม่ที่จะยกเลิกเฉพาะที่นั่ง ${seatName}? ที่นั่งอื่นในการจองนี้จะยังคงใช้งานได้ตามปกติ`,
      confirmText: `ยืนยันยกเลิกที่นั่ง ${seatName}`,
      cancelText: "ย้อนกลับ",
      variant: "destructive",
      onConfirm: () => {
        setCancelingItem(item);
        setCancelPhone("");
      },
    });
  };

  const handleConfirmCancelSingleItem = async () => {
    if (!cancelingItem) return;
    if (!cancelPhone) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ที่ใช้จองก่อนยืนยัน");
      return;
    }

    const seatName = cancelingItem.seat ? `${cancelingItem.seat.columnName}${cancelingItem.seat.rowName}` : 'ที่นั่ง';

    setCancelling(true);
    try {
      await apiClient.delete(`/api/bookings/${bookingId}/items/${cancelingItem.id}`, {
        params: { phoneNumber: cancelPhone.trim() },
      });
      toast.success(`ยกเลิกที่นั่ง ${seatName} เรียบร้อยแล้ว`);
      setCancelingItem(null);
      setCancelPhone("");
      void refetch();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ??
            "เบอร์โทรศัพท์ไม่ถูกต้อง ไม่สามารถยกเลิกที่นั่งนี้ได้"
        );
      } else {
        toast.error("เกิดข้อผิดพลาดในการยกเลิกที่นั่ง");
      }
    } finally {
      setCancelling(false);
    }
  };

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48 bg-surface-elevated" />
        <Skeleton className="h-64 w-full bg-surface-elevated rounded-2xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-8 relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
            <XCircle className="relative w-24 h-24 text-red-500 mx-auto drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white font-prompt tracking-wide">
              ไม่พบข้อมูลการจอง
            </h1>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              ขออภัย เราไม่พบข้อมูลการจองรหัส <br />
              <code className="inline-block mt-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-brand-red text-sm font-mono break-all">
                {bookingId}
              </code>
            </p>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(227,24,55,0.3)] hover:shadow-[0_0_30px_rgba(227,24,55,0.5)] hover:-translate-y-0.5"
            >
              กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const b = booking;
  const isCanceled = b.status === "Canceled" || String(b.status) === "1";
  const phone = b.customer?.phoneNumber ?? "-";
  const email = b.customer?.email;
  const activeItems = b.bookingItems?.filter((i) => i.itemStatus === "Active" || String(i.itemStatus) === "0") ?? [];
  const totalAmount = activeItems.reduce((sum, i) => sum + i.price, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-red/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-10 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          กลับหน้าแรก
        </Link>

        <div className="text-center mb-10">
          {isCanceled || activeItems.length === 0 ? (
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
          ) : (
            <div className="relative inline-block mb-6">
              <CheckCircle2 className="w-20 h-20 text-brand-red mx-auto drop-shadow-[0_0_15px_rgba(227, 24, 55,0.5)]" />
              <Sparkles className="absolute -top-2 -right-4 w-8 h-8 text-brand-red animate-pulse" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-white font-prompt mb-3 tracking-wide">
            {isCanceled || activeItems.length === 0 ? "การจองถูกยกเลิกแล้ว" : "จองตั๋วสำเร็จ!"}
          </h1>
          <p className="text-gray-400 text-lg">
            {isCanceled || activeItems.length === 0
              ? "ตั๋วทุกใบในการจองนี้ได้ถูกยกเลิกเรียบร้อยแล้ว"
              : "แสดง E-Ticket นี้ที่จุดตรวจตั๋วเพื่อเข้าชมภาพยนตร์ (สามารถเลือกยกเลิกทีละที่นั่งได้)"}
          </p>
        </div>

        {/* The Ticket */}
        <div className="relative rounded-3xl bg-gray-900 border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(227, 24, 55,0.05)]">
          <div className="h-2 w-full bg-gradient-to-r from-brand-red-dark via-brand-red to-brand-red-dark" />

          <div className="p-8 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 text-brand-red">
                <Hash className="w-5 h-5" />
                <span className="font-bold tracking-widest text-sm">
                  BOOKING REFERENCE
                </span>
              </div>
              <code className="text-sm sm:text-base text-brand-red bg-brand-red/10 px-4 py-2 rounded-xl border border-brand-red/20 font-mono tracking-wider break-all shadow-[0_0_10px_rgba(227, 24, 55,0.1)]">
                {b.id}
              </code>
            </div>

            <div className="w-full h-px bg-white/10" />

            {b.bookingItems?.map((item) => {
              const isItemActive = item.itemStatus === "Active" || String(item.itemStatus) === "0";
              const seatName = item.seat ? `${item.seat.columnName}${item.seat.rowName}` : 'ที่นั่ง';

              return (
                <div
                  key={item.id}
                  className="relative bg-gray-800/50 rounded-2xl p-6 border border-white/5 space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-red/20 flex items-center justify-center flex-shrink-0 border border-brand-red/30">
                      <Ticket className="w-6 h-6 text-brand-red" />
                    </div>

                    <div className="flex-1 space-y-3">
                      <h3 className="text-xl font-bold text-white drop-shadow-md">
                        {item.showtime?.movie?.title ?? 'ภาพยนตร์ Nature MiniPlex'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                        {item.showtime?.cinema && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-red" />
                            <span>โรงภาพยนตร์ {item.showtime.cinema.name}</span>
                          </div>
                        )}
                        {item.showtime?.showDateTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-brand-red" />
                            <span>
                              {formatDateTime(item.showtime.showDateTime)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-brand-red text-white text-sm font-bold rounded-lg shadow-md shadow-brand-red/20">
                            ที่นั่ง {seatName}
                          </span>
                          <Badge
                            className={
                              isItemActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                                : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/10"
                            }
                          >
                            {isItemActive ? "ใช้งานได้" : "ยกเลิกแล้ว"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <span className="text-brand-red font-bold text-lg">
                            ฿{item.price.toFixed(0)}
                          </span>

                          {/* Individual Seat Cancellation Button */}
                          {isItemActive && !isCanceled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelSingleSeat(item)}
                              className="text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 rounded-lg border border-white/10 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              ยกเลิกที่นั่งนี้
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="w-full h-px bg-white/10" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-300">
                  <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                    <Phone className="w-4 h-4 text-brand-red" />
                  </div>
                  <span className="text-base font-medium">{phone}</span>
                </div>
                {email && (
                  <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <Mail className="w-4 h-4 text-brand-red" />
                    </div>
                    <span>{email}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-1 font-semibold">
                  ราคารวม ({activeItems.length} ที่นั่ง)
                </p>
                <p className="text-4xl font-bold text-brand-red drop-shadow-[0_0_10px_rgba(227, 24, 55,0.3)]">
                  ฿{totalAmount.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-8 pb-4 border-t border-dashed border-white/20 mt-4">
              <div className="flex gap-[2px] justify-center h-16 w-full max-w-sm opacity-80">
                {Array.from({ length: 45 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-400 rounded-sm"
                    style={{
                      width:
                        i % 5 === 0
                          ? "4px"
                          : i % 3 === 0
                            ? "3px"
                            : i % 2 === 0
                              ? "2px"
                              : "1px",
                      height: "100%",
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 font-mono tracking-[0.3em]">
                {b.id.slice(0, 24).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="h-3 w-full bg-gradient-to-r from-brand-red-dark via-brand-red to-brand-red-dark" />
        </div>

        {!isCanceled && activeItems.length > 0 && (
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              className="border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all rounded-xl px-6 h-12"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              ยกเลิกตั๋วทุกใบในการจองนี้
            </Button>
          </div>
        )}

        {/* Dialog for Cancelling Entire Booking */}
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                ยืนยันการยกเลิกตั๋วทั้งหมด
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                กรอกเบอร์โทรศัพท์ที่ใช้จองเพื่อยืนยันการยกเลิกตั๋วทุกใบในการจองนี้
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Label htmlFor="cancel-phone" className="text-gray-300">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="cancel-phone"
                type="tel"
                placeholder="0891234567"
                value={cancelPhone}
                onChange={(e) => setCancelPhone(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-red-500 h-12 rounded-xl"
                maxLength={10}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCancelOpen(false)}
                disabled={cancelling}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
              >
                ย้อนกลับ
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelClick}
                disabled={cancelling}
                className="bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    กำลังยกเลิก...
                  </>
                ) : (
                  "ยืนยันยกเลิกทั้งหมด"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for Cancelling Single Seat Item */}
        <Dialog open={Boolean(cancelingItem)} onOpenChange={(open) => !open && setCancelingItem(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                ยืนยันการยกเลิกที่นั่ง {cancelingItem?.seat ? `${cancelingItem.seat.columnName}${cancelingItem.seat.rowName}` : ''}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                กรอกเบอร์โทรศัพท์ที่ใช้จองเพื่อยืนยันการยกเลิกที่นั่งนี้
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Label htmlFor="cancel-item-phone" className="text-gray-300">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="cancel-item-phone"
                type="tel"
                placeholder="0891234567"
                value={cancelPhone}
                onChange={(e) => setCancelPhone(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-red-500 h-12 rounded-xl"
                maxLength={10}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setCancelingItem(null)}
                disabled={cancelling}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
              >
                ย้อนกลับ
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancelSingleItem}
                disabled={cancelling}
                className="bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 font-bold"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    กำลังยกเลิก...
                  </>
                ) : (
                  "ยืนยันยกเลิกที่นั่งนี้"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
