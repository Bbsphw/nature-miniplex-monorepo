'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import { useCreateBooking } from '@/features/bookings/hooks/useCreateBooking';
import { useBookingStore } from '@/store/useBookingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SeatStatus } from '@/types/api';
import { Loader2, Phone, Ticket, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  showtimeId: number;
  ticketPrice: number;
  seats: SeatStatus[];
  onBookingFailed?: (seatId: number | null) => void;
}

export function BookingForm({ showtimeId, ticketPrice, seats, onBookingFailed }: BookingFormProps) {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const router = useRouter();
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const clearSeats = useBookingStore((state) => state.clearSeats);
  const { mutateAsync: createBooking, isPending } = useCreateBooking();

  const selectedSeatObjects = seats.filter((s) => selectedSeats.includes(s.seatId));
  const totalPrice = selectedSeats.length * ticketPrice;

  const validatePhone = (value: string): string => {
    if (!value) return 'กรุณากรอกเบอร์โทรศัพท์';
    if (!/^\d+$/.test(value)) return 'กรอกเฉพาะตัวเลขเท่านั้น';
    if (value.length < 9 || value.length > 10) return 'เบอร์โทรต้องมี 9-10 หลัก';
    return '';
  };

  const validateEmail = (value: string): string => {
    if (!value) return ''; // Optional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'รูปแบบอีเมลไม่ถูกต้อง';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pErr = validatePhone(phone);
    const eErr = validateEmail(email);
    if (pErr) setPhoneError(pErr);
    if (eErr) setEmailError(eErr);
    if (pErr || eErr) return;

    if (selectedSeats.length === 0) {
      toast.error('กรุณาเลือกที่นั่งอย่างน้อย 1 ที่');
      return;
    }
    if (selectedSeats.length > 4) {
      toast.error('เลือกได้สูงสุด 4 ที่นั่งต่อการจอง');
      return;
    }

    try {
      const bookingId = await createBooking({
        showtimeId,
        phoneNumber: phone,
        email: email || undefined,
        seatIds: selectedSeats,
      });
      clearSeats();
      toast.success('จองตั๋วสำเร็จ! กำลังพาไปหน้ายืนยัน...');
      router.push(`/booking-confirmation/${bookingId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 409 || status === 400) {
          // Fire optimistic UI revert/animation
          if (onBookingFailed) {
             // We'll shake the first selected seat, or we could shake all by passing them individually.
             // For now, let's pass the first seat id to shake it, to draw attention.
             onBookingFailed(selectedSeats[0] || null);
          }
          // The EXACT error message required by the SRS
          toast.error('ที่นั่งนี้เพิ่งถูกจองไป กรุณาเลือกที่นั่งใหม่', {
             style: { backgroundColor: '#dc2626', color: '#fff', border: 'none' }
          });
        } else {
          toast.error(error.response?.data?.message ?? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
        }
      } else {
        toast.error('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
      }
    }
  };

  if (selectedSeats.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-gray-900/80 backdrop-blur-md text-gray-400 text-sm shadow-xl">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-brand-red/70" />
        <span>เลือกที่นั่งจากผังด้านบนเพื่อดำเนินการจอง (สูงสุด 4 ที่นั่ง)</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-brand-red/20 bg-gray-900/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(227, 24, 55,0.1)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex items-center gap-3 text-white font-bold text-lg">
        <Ticket className="w-5 h-5 text-brand-red" />
        <span>สรุปการจอง</span>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">ที่นั่งที่เลือก</p>
        <div className="flex flex-wrap gap-2">
          {selectedSeatObjects.map((seat) => (
            <span
              key={seat.seatId}
              className="px-4 py-1.5 rounded-xl bg-brand-red text-white text-sm font-bold shadow-md shadow-brand-red/20"
            >
              {seat.columnName}{seat.rowName}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <span className="text-sm text-gray-400">
            {selectedSeats.length} ที่นั่ง × ฿{ticketPrice.toFixed(0)}
          </span>
          <span className="text-2xl font-bold text-brand-red drop-shadow-[0_0_8px_rgba(227, 24, 55,0.5)]">
            ฿{totalPrice.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="booking-phone" className="text-gray-300 font-medium">
          <Phone className="w-4 h-4 inline mr-2 text-brand-red" />
          เบอร์โทรศัพท์ (9-10 หลัก)
        </Label>
        <Input
          id="booking-phone"
          type="tel"
          inputMode="numeric"
          placeholder="0891234567"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneError) setPhoneError('');
          }}
          className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-brand-red h-12 rounded-xl text-lg transition-all ${phoneError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          maxLength={10}
        />
        {phoneError && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4" />
            {phoneError}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="booking-email" className="text-gray-300 font-medium flex items-center justify-between">
          <span>อีเมล (เพื่อรับ E-Ticket)</span>
          <span className="text-xs text-gray-500 font-normal border border-gray-700 px-2 py-0.5 rounded">Optional</span>
        </Label>
        <Input
          id="booking-email"
          type="email"
          inputMode="email"
          placeholder="customer@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 focus-visible:ring-brand-red h-12 rounded-xl text-lg transition-all ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
        />
        {emailError && (
          <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4" />
            {emailError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-brand-red hover:bg-brand-red text-white font-bold h-14 rounded-xl shadow-lg shadow-brand-red/30 transition-all hover:shadow-brand-red/50 hover:scale-[1.02] active:scale-[0.98] text-lg"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังยืนยันที่นั่ง...
          </span>
        ) : (
          `ชำระเงิน ${totalPrice.toFixed(0)} บาท`
        )}
      </Button>
    </form>
  );
}
