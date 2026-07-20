'use client';

import { useState } from 'react';
import { useCinemas } from '@/features/cinemas/hooks/useCinemas';
import { useShowtimes } from '@/features/showtimes/hooks/useShowtimes';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, Clock, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { Showtime } from '@/types/api';

interface ShowtimePickerProps {
  movieId: number;
}

export function ShowtimePicker({ movieId }: ShowtimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { data: cinemas, isLoading: cinemasLoading } = useCinemas();
  const { data: showtimes, isLoading: showtimesLoading } = useShowtimes({
    movieId,
    date: selectedDate || undefined,
  });

  // Extract unique available dates
  const availableDates = Array.from(
    new Set(
      (showtimes ?? []).map((s) => {
        return new Date(s.showDateTime).toISOString().slice(0, 10);
      })
    )
  ).sort();

  // If no date is selected but we have available dates, select the first one automatically
  if (!selectedDate && availableDates.length > 0) {
    setSelectedDate(availableDates[0]);
  }

  // Group showtimes by cinema
  const showtimesByCinema = (showtimes || []).reduce((acc, showtime) => {
    const cinemaId = showtime.cinemaId;
    if (!acc[cinemaId]) {
      acc[cinemaId] = [];
    }
    acc[cinemaId].push(showtime);
    return acc;
  }, {} as Record<number, Showtime[]>);

  return (
    <div className="space-y-8">
      {/* Date Selector (Horizontal Scroll) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold mb-2">
          <CalendarDays className="w-5 h-5 text-brand-red" />
          <h2>เลือกวันที่</h2>
        </div>
        
        <div className="flex overflow-x-auto pb-4 gap-3 snap-x touch-pan-x hide-scrollbar">
          {availableDates.length === 0 && showtimesLoading ? (
             Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="min-w-[80px] h-[72px] rounded-xl bg-gray-800 flex-shrink-0" />
             ))
          ) : availableDates.length === 0 ? (
            <div className="text-gray-400 text-sm">ไม่พบรอบฉาย</div>
          ) : (
            availableDates.map(date => {
              const d = new Date(date);
              const isSelected = selectedDate === date;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`snap-start min-w-[80px] flex-shrink-0 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                    isSelected 
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30 scale-105' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-brand-red hover:text-brand-red'
                  }`}
                >
                  <span className="text-xs font-medium uppercase">
                    {d.toLocaleDateString('th-TH', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-bold">
                    {d.getDate()}
                  </span>
                  <span className="text-xs">
                    {d.toLocaleDateString('th-TH', { month: 'short' })}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Showtimes by Cinema */}
      <div className="space-y-6">
        {cinemasLoading || showtimesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 bg-gray-800" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24 bg-gray-800 rounded-full" />
              <Skeleton className="h-10 w-24 bg-gray-800 rounded-full" />
            </div>
          </div>
        ) : Object.keys(showtimesByCinema).length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm bg-gray-900/50 rounded-2xl border border-gray-800">
            ไม่มีรอบฉายสำหรับวันที่เลือก
          </div>
        ) : (
          Object.entries(showtimesByCinema).map(([cinemaId, times]) => {
            const cinema = cinemas?.find(c => c.id === Number(cinemaId));
            return (
              <div key={cinemaId} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-brand-red rounded-full"></span>
                  {cinema?.name || 'โรงภาพยนตร์'}
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  {times.map(showtime => {
                    const timeLabel = new Date(showtime.showDateTime).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    if (showtime.isLocked) {
                      return (
                        <div key={showtime.id} className="flex flex-col items-center justify-center px-5 py-2.5 rounded-full bg-gray-800 border border-gray-700 text-gray-500 opacity-60 cursor-not-allowed">
                           <span className="flex items-center gap-1 font-semibold text-sm">
                             <Lock className="w-3 h-3" /> {timeLabel}
                           </span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        href={`/booking/${showtime.id}`}
                        key={showtime.id}
                        className="group relative flex flex-col items-center justify-center px-5 py-2.5 rounded-full border border-gray-700 bg-gray-800 text-gray-200 hover:border-brand-red hover:bg-brand-red hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        <span className="font-semibold tracking-wider">{timeLabel}</span>
                        {/* Tooltip for price */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                          ฿{showtime.ticketPrice.toFixed(0)} / ที่นั่ง
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
