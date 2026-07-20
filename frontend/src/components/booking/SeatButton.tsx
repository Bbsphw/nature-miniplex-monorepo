import { cn } from '@/lib/utils';
import type { SeatStatus } from '@/types/api';

interface SeatButtonProps {
  seat: SeatStatus;
  isSelected: boolean;
  onToggle: (seatId: number) => void;
  onCancelSeat?: (seat: SeatStatus) => void;
  isProcessing?: boolean;
  isFailed?: boolean;
}

export function SeatButton({ seat, isSelected, onToggle, onCancelSeat, isProcessing, isFailed }: SeatButtonProps) {
  const isBooked = seat.status === 'Booked';
  // SRS Specification: Seat names are Column + Row (e.g. A1, B1, C1)
  const seatLabel = `${seat.columnName}${seat.rowName}`;

  const handleClick = () => {
    if (isProcessing) return;
    if (isBooked) {
      if (onCancelSeat) onCancelSeat(seat);
    } else {
      onToggle(seat.seatId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      title={
        isBooked && seat.bookerPhone
          ? `จองโดย: ${seat.bookerPhone} (คลิกเพื่อยกเลิก)`
          : isSelected
            ? 'คลิกเพื่อยกเลิกการเลือก'
            : 'คลิกเพื่อเลือกที่นั่ง'
      }
      aria-label={`ที่นั่ง ${seatLabel} — ${isBooked ? `จองแล้วโดย ${seat.bookerPhone}` : isSelected ? 'เลือกแล้ว' : 'ว่าง'}`}
      className={cn(
        'relative flex flex-col items-center justify-center min-w-[3.6rem] sm:min-w-[4.4rem] h-11 sm:h-12 rounded-xl text-xs font-semibold transition-all duration-300 select-none p-1 border',
        // Shake animation on error
        isFailed && 'animate-shake border-red-500 border-2',
        // SRS State styles:
        // Available: White button ("ปุ่มที่นั่งที่ยังไม่มีการจอง มีพื้นปุ่มสีขาว")
        // Booked: Gray button with phone number ("ปุ่มที่นั่งที่จองแล้ว มีพื้นปุ่มสีเทา พร้อมกับเบอร์โทรศัพท์ของผู้จอง")
        isBooked
          ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750 cursor-pointer shadow-inner'
          : isProcessing
            ? 'bg-amber-500 text-amber-950 cursor-not-allowed animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
            : isSelected
              ? 'bg-brand-red text-white shadow-md shadow-brand-red/40 scale-105 border-brand-red font-bold'
              : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-gray-400 cursor-pointer font-bold shadow-sm'
      )}
    >
      <span className={cn('text-xs font-extrabold', isBooked ? 'text-gray-300' : isSelected ? 'text-white' : 'text-gray-900')}>
        {seatLabel}
      </span>
      {isBooked && (
        <span className="text-[9px] font-mono leading-none mt-0.5 text-gray-400 font-normal">
          {seat.bookerPhone ? `(${seat.bookerPhone})` : 'จองแล้ว'}
        </span>
      )}
    </button>
  );
}
