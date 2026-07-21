import React from 'react';
import { cn, maskPhoneNumber } from '@/lib/utils';
import type { SeatStatus } from '@/types/api';

interface SeatButtonProps {
  seat: SeatStatus;
  isSelected: boolean;
  onToggle: (seatId: number) => void;
  onCancelSeat?: (seat: SeatStatus) => void;
  isProcessing?: boolean;
  isFailed?: boolean;
}

export const SeatButton = React.memo(
  function SeatButton({ seat, isSelected, onToggle, onCancelSeat, isProcessing, isFailed }: SeatButtonProps) {
    const isBooked = seat.status === 'Booked';
    const seatLabel = `${seat.columnName}${seat.rowName}`;
    const maskedPhone = maskPhoneNumber(seat.bookerPhone);

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
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        aria-pressed={isSelected}
        aria-label={`ที่นั่ง ${seatLabel} — ${isBooked ? `จองแล้ว (${maskedPhone})` : isSelected ? 'เลือกแล้ว' : 'ว่าง'}`}
        title={
          isBooked
            ? `จองโดย: ${maskedPhone} (คลิกเพื่อยกเลิก)`
            : isSelected
              ? 'คลิกเพื่อยกเลิกการเลือก'
              : 'คลิกเพื่อเลือกที่นั่ง'
        }
        className={cn(
          'relative flex flex-col items-center justify-center min-w-[3.8rem] sm:min-w-[4.6rem] h-12 sm:h-13 rounded-xl text-xs font-semibold transition-all duration-300 select-none p-1 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
          isFailed && 'animate-shake border-red-500 border-2',
          isBooked
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750 cursor-pointer shadow-inner'
            : isProcessing
              ? 'bg-amber-500 text-amber-950 cursor-not-allowed animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : isSelected
                ? 'bg-red-600 text-white shadow-md shadow-red-600/40 scale-105 border-red-600 font-bold'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-gray-400 cursor-pointer font-bold shadow-sm'
        )}
      >
        <span className={cn('text-xs font-extrabold', isBooked ? 'text-gray-300' : isSelected ? 'text-white' : 'text-gray-900')}>
          {seatLabel}
        </span>
        {isBooked && (
          <span className="text-[9px] font-mono leading-none mt-0.5 text-gray-400 font-normal">
            ({maskedPhone})
          </span>
        )}
      </button>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.isFailed === nextProps.isFailed &&
    prevProps.seat.status === nextProps.seat.status &&
    prevProps.seat.bookerPhone === nextProps.seat.bookerPhone
);
