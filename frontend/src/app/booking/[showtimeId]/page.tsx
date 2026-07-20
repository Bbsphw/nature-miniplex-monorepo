'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useShowtimeSeats } from '@/features/showtimes/hooks/useShowtimeSeats';
import { SeatGrid } from '@/components/booking/SeatGrid';
import { BookingForm } from '@/components/booking/BookingForm';
import { useBookingStore } from '@/store/useBookingStore';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Clock, Tag, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import type { Showtime } from '@/types/api';

export default function BookingPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const showtimeIdNum = Number(showtimeId);
  const clearSeats = useBookingStore((state) => state.clearSeats);
  const [failedSeatId, setFailedSeatId] = useState<number | null>(null);

  useEffect(() => {
    clearSeats();
  }, [clearSeats]);

  const { data: showtime, isLoading: showtimeLoading } = useQuery<Showtime>({
    queryKey: ['showtime', showtimeIdNum],
    queryFn: async () => {
      const { data } = await apiClient.get<Showtime>(`/api/showtimes/${showtimeIdNum}`);
      return data;
    },
    enabled: showtimeIdNum > 0,
  });

  const {
    data: seats = [],
    isLoading: seatsLoading,
    dataUpdatedAt,
  } = useShowtimeSeats(showtimeIdNum);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={showtime?.movieId ? `/movies/${showtime.movieId}` : '/'}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          กลับไปหน้าเลือกรอบฉาย
        </Link>

        {/* Header Info Card */}
        <div className="rounded-3xl border border-white/5 bg-gray-900/50 backdrop-blur-md p-6 sm:p-8 mb-8 shadow-xl">
          {showtimeLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3 max-w-sm bg-gray-800" />
              <Skeleton className="h-5 w-1/2 max-w-xs bg-gray-800" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white font-prompt mb-4 tracking-wide">
                {showtime?.movie?.title ?? 'เลือกที่นั่ง'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-300">
                {showtime?.cinema && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                    <MapPin className="w-4 h-4 text-brand-red" />
                    <span>{showtime.cinema.name}</span>
                  </div>
                )}
                {showtime?.showDateTime && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                    <Clock className="w-4 h-4 text-brand-red" />
                    <span className="font-medium text-white">{formatTime(showtime.showDateTime)}</span>
                  </div>
                )}
                {showtime?.ticketPrice && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                    <Tag className="w-4 h-4 text-brand-red" />
                    <span>
                      <strong className="text-brand-red text-base">฿{showtime.ticketPrice.toFixed(0)}</strong> / ที่นั่ง
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {dataUpdatedAt > 0 && (
          <div className="flex items-center justify-end gap-2 text-xs text-brand-red/70 mb-4 px-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>อัพเดทแบบ real-time</span>
          </div>
        )}

        {/* Seat Map Container */}
        <div className="rounded-3xl border border-white/5 bg-gray-900/30 backdrop-blur-sm p-6 sm:p-10 mb-8 shadow-2xl overflow-hidden">
          <SeatGrid seats={seats} isLoading={seatsLoading} showtimeId={showtimeIdNum} failedSeatId={failedSeatId} />
        </div>

        {/* Bottom Booking Form / Sticky Bar */}
        {showtime && (
          <div className="sticky bottom-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <BookingForm
              showtimeId={showtimeIdNum}
              ticketPrice={showtime.ticketPrice}
              seats={seats}
              onBookingFailed={(seatId) => {
                // If a specific seat failed, trigger the shake animation
                setFailedSeatId(seatId);
                setTimeout(() => setFailedSeatId(null), 1000); // Clear after animation
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
