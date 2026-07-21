'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMovies } from '@/features/movies/hooks/useMovies';
import { useShowtimes } from '@/features/showtimes/hooks/useShowtimes';
import { Search, Film, Calendar } from 'lucide-react';
import { toast } from '@/store/useToastStore';

export function SRSBookingFilterBar() {
  const router = useRouter();
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<string>('');

  // Fetch active movies
  const { data: movies, isLoading: isMoviesLoading } = useMovies(true);

  // Fetch showtimes for selected movie
  const { data: showtimes, isLoading: isShowtimesLoading } = useShowtimes({
    movieId: selectedMovieId ? Number(selectedMovieId) : undefined,
  });

  const handleMovieChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMovieId(val);
    setSelectedShowtimeId(''); // Reset showtime when movie changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovieId) {
      toast.error('กรุณาเลือกเรื่องภาพยนตร์');
      return;
    }

    if (selectedShowtimeId) {
      // Direct navigation to seat booking page for that specific showtime
      router.push(`/booking/${selectedShowtimeId}`);
    } else {
      // Navigate to movie detail page showing all showtimes
      router.push(`/movies/${selectedMovieId}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <form
        onSubmit={handleSearch}
        className="bg-gray-900/90 border border-gray-800 backdrop-blur-xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row items-center gap-4"
      >
        {/* Dropdown 1: เลือกเรื่องหนัง */}
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-brand-red" />
            เลือกเรื่องหนัง
          </label>
          <select
            value={selectedMovieId}
            onChange={handleMovieChange}
            disabled={isMoviesLoading}
            className="w-full bg-gray-800/90 border border-gray-700 hover:border-gray-600 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer appearance-none"
          >
            <option value="">== เลือกเรื่องหนัง ==</option>
            {movies?.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-[34px] pointer-events-none text-gray-400 text-xs">
            ▼
          </div>
        </div>

        {/* Dropdown 2: เลือกวันที่ (รอบฉาย) */}
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-red" />
            เลือกวันที่ (รอบฉาย)
          </label>
          <select
            value={selectedShowtimeId}
            onChange={(e) => setSelectedShowtimeId(e.target.value)}
            disabled={!selectedMovieId || isShowtimesLoading}
            className="w-full bg-gray-800/90 border border-gray-700 hover:border-gray-600 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {!selectedMovieId
                ? '== กรุณาเลือกเรื่องหนังก่อน =='
                : isShowtimesLoading
                ? 'กำลังโหลดรอบฉาย...'
                : showtimes?.length === 0
                ? 'ไม่มีรอบฉาย'
                : '== เลือกวันที่ (รอบฉาย) =='}
            </option>
            {showtimes?.map((st) => {
              const dt = new Date(st.showDateTime);
              const day = String(dt.getDate()).padStart(2, '0');
              const month = String(dt.getMonth() + 1).padStart(2, '0');
              const year = dt.getFullYear();
              const dateStr = `${day}/${month}/${year}`;
              const timeStr = dt.toLocaleTimeString('th-TH', {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
              });
              const cinemaName = st.cinema?.name || (st.cinemaId === 1 ? 'ศรีราชา' : 'บางแสน');
              const lockedTag = st.isLocked ? ' (เริ่มแล้ว)' : '';

              return (
                <option key={st.id} value={st.id} disabled={st.isLocked}>
                  {dateStr} รอบ {timeStr}น. — โรง{cinemaName}{lockedTag}
                </option>
              );
            })}
          </select>
          <div className="absolute right-3.5 top-[34px] pointer-events-none text-gray-400 text-xs">
            ▼
          </div>
        </div>

        {/* Button: ค้นหา */}
        <div className="w-full md:w-auto self-end">
          <button
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-brand-red to-brand-red-dark hover:from-brand-red-light hover:to-brand-red text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-red/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>ค้นหา</span>
          </button>
        </div>
      </form>
    </div>
  );
}
