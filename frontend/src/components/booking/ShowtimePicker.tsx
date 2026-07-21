'use client';

import { useState } from 'react';
import { useCinemas } from '@/features/cinemas/hooks/useCinemas';
import { useShowtimes } from '@/features/showtimes/hooks/useShowtimes';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { Showtime } from '@/types/api';

interface ShowtimePickerProps {
  movieId: number;
}

export function ShowtimePicker({ movieId }: ShowtimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { data: cinemas, isLoading: cinemasLoading } = useCinemas();

  // Fetch ALL showtimes for this movie without filtering by date on API level
  // so that all available date tabs remain visible in the header
  const { data: showtimes, isLoading: showtimesLoading } = useShowtimes({
    movieId,
  });

  // Extract unique available dates in Asia/Bangkok timezone
  const availableDates = Array.from(
    new Set(
      (showtimes ?? []).map((s) => {
        return new Date(s.showDateTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      })
    )
  ).sort();

  // If no date is selected but we have available dates, select the first one automatically
  if (!selectedDate && availableDates.length > 0) {
    setSelectedDate(availableDates[0]);
  }

  // Filter showtimes by the selected date locally
  const filteredShowtimes = (showtimes || []).filter((s) => {
    if (!selectedDate) return true;
    const showDateStr = new Date(s.showDateTime).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    return showDateStr === selectedDate;
  });

  // Group filtered showtimes by cinema
  const showtimesByCinema = filteredShowtimes.reduce((acc, showtime) => {
    const cinemaId = showtime.cinemaId;
    if (!acc[cinemaId]) {
      acc[cinemaId] = [];
    }
    acc[cinemaId].push(showtime);
    return acc;
  }, {} as Record<number, Showtime[]>);

  return (
    <div className="space-y-8">
      {/* Date Selector Header Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold mb-2">
          <CalendarDays className="w-5 h-5 text-brand-red" />
          <h2 className="text-lg">เลือกวันที่และรอบฉาย</h2>
        </div>

        <div className="flex overflow-x-auto pb-4 gap-3 snap-x touch-pan-x hide-scrollbar">
          {availableDates.length === 0 && showtimesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[90px] h-[76px] rounded-2xl bg-gray-800 flex-shrink-0" />
            ))
          ) : availableDates.length === 0 ? (
            <div className="text-gray-400 text-sm py-4">ไม่พบรอบฉายสำหรับภาพยนตร์เรื่องนี้</div>
          ) : (
            availableDates.map((date) => {
              const [year, month, day] = date.split('-').map(Number);
              const d = new Date(year, month - 1, day);
              const isSelected = selectedDate === date;

              const weekdayStr = d.toLocaleDateString('th-TH', { weekday: 'short' });
              const monthStr = d.toLocaleDateString('th-TH', { month: 'short' });

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`snap-start min-w-[90px] flex-shrink-0 flex flex-col items-center justify-center py-2.5 px-4 rounded-2xl transition-all duration-300 ${
                    isSelected
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30 scale-105 font-bold'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-brand-red hover:text-brand-red'
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-wider">
                    {weekdayStr}
                  </span>
                  <span className="text-2xl font-bold my-0.5">
                    {day}
                  </span>
                  <span className="text-xs opacity-90">
                    {monthStr}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Showtimes List Grouped by Cinema */}
      <div className="space-y-6">
        {cinemasLoading || showtimesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 bg-gray-800" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-28 bg-gray-800 rounded-full" />
              <Skeleton className="h-12 w-28 bg-gray-800 rounded-full" />
            </div>
          </div>
        ) : Object.keys(showtimesByCinema).length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm bg-gray-900/50 rounded-2xl border border-gray-800">
            ไม่มีรอบฉายสำหรับวันที่เลือก
          </div>
        ) : (
          Object.entries(showtimesByCinema).map(([cinemaId, times]) => {
            const cinema = cinemas?.find((c) => c.id === Number(cinemaId));
            return (
              <div key={cinemaId} className="bg-gray-900/90 rounded-2xl p-6 border border-gray-800 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-6 bg-brand-red rounded-full" />
                  โรงภาพยนตร์ {cinema?.name || (Number(cinemaId) === 1 ? 'ศรีราชา' : 'บางแสน')}
                </h3>

                <div className="flex flex-wrap gap-3">
                  {times.map((showtime) => {
                    const dt = new Date(showtime.showDateTime);
                    const timeLabel = dt.toLocaleTimeString('th-TH', {
                      timeZone: 'Asia/Bangkok',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    if (showtime.isLocked) {
                      return (
                        <div
                          key={showtime.id}
                          className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gray-800/80 border border-gray-700 text-gray-500 opacity-60 cursor-not-allowed text-sm font-medium"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>รอบ {timeLabel}น. (เริ่มแล้ว)</span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        href={`/booking/${showtime.id}`}
                        key={showtime.id}
                        className="group relative flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-700 bg-gray-800 text-white font-bold hover:border-brand-red hover:bg-brand-red transition-all duration-300 shadow-md hover:scale-105"
                      >
                        <span className="text-base tracking-wide">รอบ {timeLabel}น.</span>
                        <span className="text-xs text-brand-red group-hover:text-white transition-colors bg-brand-red/10 group-hover:bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                          ฿{showtime.ticketPrice.toFixed(0)}
                        </span>
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
