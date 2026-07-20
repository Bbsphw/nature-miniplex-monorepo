import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useBookingStore } from '@/store/useBookingStore';
import { SeatButton } from './SeatButton';
import type { SeatStatus } from '@/types/api';
import { Loader2, Tv, Info, AlertTriangle, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SeatGridProps {
  seats: SeatStatus[];
  isLoading: boolean;
  showtimeId?: number;
  failedSeatId?: number | null;
}

export function SeatGrid({ seats, isLoading, showtimeId, failedSeatId }: SeatGridProps) {
  const queryClient = useQueryClient();
  const selectedSeats = useBookingStore((state) => state.selectedSeats);
  const toggleSeat = useBookingStore((state) => state.toggleSeat);
  const isProcessing = useBookingStore((state) => state.isProcessing || false);

  const [cancelingSeat, setCancelingSeat] = useState<SeatStatus | null>(null);
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleConfirmCancel = async () => {
    if (!cancelingSeat || !showtimeId) return;
    if (!cancelPhone) {
      toast.error('กรุณากรอกเบอร์โทรศัพท์ที่ใช้จองเพื่อยืนยัน');
      return;
    }

    setCancelLoading(true);
    try {
      await apiClient.post('/api/bookings/cancel-seat', {
        showtimeId: showtimeId,
        seatId: cancelingSeat.seatId,
        phoneNumber: cancelPhone.trim()
      });

      toast.success(`ยกเลิกการจองที่นั่ง ${cancelingSeat.columnName}${cancelingSeat.rowName} สำเร็จ`);
      void queryClient.invalidateQueries({ queryKey: ['showtime-seats'] });
      setCancelingSeat(null);
      setCancelPhone('');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'เบอร์โทรศัพท์ไม่ตรงกับผู้จองที่นั่งนี้ ไม่สามารถยกเลิกได้');
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6 py-8">
        <div className="flex justify-center"><Skeleton className="w-64 h-2 bg-gray-800" /></div>
        <div className="flex flex-col gap-4 items-center mt-10">
          {[1, 2, 3].map(row => (
            <div key={row} className="flex gap-2">
              {[1, 2, 3, 4].map(col => (
                <Skeleton key={col} className="w-16 h-12 rounded-xl bg-gray-800/50" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!seats.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3 bg-gray-900/30 rounded-2xl border border-gray-800">
        <Info className="w-8 h-8 opacity-50" />
        <span>ไม่พบข้อมูลผังที่นั่ง</span>
      </div>
    );
  }

  const rows: Record<string, SeatStatus[]> = {};
  for (const seat of seats) {
    if (!rows[seat.rowName]) rows[seat.rowName] = [];
    rows[seat.rowName].push(seat);
  }
  const sortedRows = Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
  for (const [, rowSeats] of sortedRows) {
    rowSeats.sort((a, b) => a.columnName.localeCompare(b.columnName, undefined, { numeric: true }));
  }

  const maxCols = Math.max(...sortedRows.map(([, s]) => s.length));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Screen Indicator */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 w-full max-w-lg">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-brand-red/50 to-transparent" />
          <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-gray-900 border border-brand-red/30 text-xs font-bold text-brand-red uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(227, 24, 55,0.1)]">
            <Tv className="w-4 h-4" />
            SCREEN (หน้าจอภาพยนตร์)
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-brand-red/50 to-transparent" />
        </div>
        <div className="w-3/4 max-w-md h-1.5 bg-gradient-to-r from-transparent via-brand-red/20 to-transparent rounded-[100%] drop-shadow-[0_4px_10px_rgba(227, 24, 55,0.3)]" />
      </div>

      {/* Seat Map */}
      <div className="overflow-x-auto pb-10 touch-pan-x touch-pan-y hide-scrollbar">
        <div className="flex flex-col gap-3 sm:gap-4 items-center min-w-max mx-auto px-4">
          {sortedRows.map(([rowName, rowSeats]) => (
            <div key={rowName} className="flex items-center gap-3 sm:gap-4">
              <span className="w-12 text-xs font-bold text-gray-500 text-right flex-shrink-0">
                แถว {rowName}
              </span>
              <div
                className="flex gap-2 sm:gap-3"
                style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
              >
                {rowSeats.map((seat) => (
                  <SeatButton
                    key={seat.seatId}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat.seatId)}
                    onToggle={toggleSeat}
                    onCancelSeat={(s) => {
                      setCancelingSeat(s);
                      setCancelPhone('');
                    }}
                    isFailed={failedSeatId === seat.seatId}
                    isProcessing={isProcessing && selectedSeats.includes(seat.seatId)}
                  />
                ))}
              </div>
              <span className="w-12 text-xs font-bold text-gray-500 text-left flex-shrink-0 opacity-0 md:opacity-100">
                แถว {rowName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend based on SRS Prototype Specification */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 mt-4 flex-wrap bg-gray-900/50 py-4 px-6 rounded-2xl border border-gray-800 text-xs">
        <div className="flex items-center gap-2 font-medium text-gray-300">
          <div className="w-5 h-5 rounded-md bg-white border border-gray-300 shadow-sm" />
          <span>ว่าง (คลิกเพื่อเลือก)</span>
        </div>
        <div className="flex items-center gap-2 font-medium text-white">
          <div className="w-5 h-5 rounded-md bg-brand-red shadow-md shadow-brand-red/40" />
          <span>เลือกแล้ว</span>
        </div>
        <div className="flex items-center gap-2 font-medium text-gray-400">
          <div className="w-5 h-5 rounded-md bg-gray-800 border border-gray-700" />
          <span>จองแล้ว (คลิกเพื่อยกเลิก)</span>
        </div>
      </div>

      {/* SRS Cancellation Modal */}
      <Dialog open={Boolean(cancelingSeat)} onOpenChange={(open) => !open && setCancelingSeat(null)}>
        <DialogContent className="bg-surface-elevated border-surface-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              ยกเลิกการจองตั๋ว — ที่นั่ง {cancelingSeat?.columnName}{cancelingSeat?.rowName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ตามข้อกำหนด SRS: การยกเลิกการจองจะต้องระบุเบอร์โทรศัพท์ที่ใช้จองให้ตรงกันเท่านั้น หากระบุถูกต้อง ที่นั่งนี้จะถูกคืนเป็นที่นั่งว่างทันที
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                กรอกเบอร์โทรศัพท์ของผู้จองเพื่อยืนยัน:
              </label>
              <Input
                type="tel"
                placeholder="0891234567"
                value={cancelPhone}
                onChange={(e) => setCancelPhone(e.target.value)}
                maxLength={10}
                className="bg-surface-base border-surface-border text-white h-11"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelingSeat(null)} disabled={cancelLoading} className="border-surface-border text-muted-foreground hover:text-white">
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmCancel} disabled={cancelLoading} className="bg-destructive hover:bg-destructive/90 text-white font-bold">
              {cancelLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              ยืนยันยกเลิกการจอง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
