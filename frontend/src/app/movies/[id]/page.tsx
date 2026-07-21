'use client';

import { useParams } from 'next/navigation';
import { useMovieById } from '@/features/movies/hooks/useMovieById';
import { ShowtimePicker } from '@/components/booking/ShowtimePicker';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Tag, Film, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const { data: movie, isLoading, error } = useMovieById(movieId);

  // Placeholder cinematic backdrop for MVP
  const backdropImage = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop`;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center space-y-6">
        <Film className="w-20 h-20 text-gray-700 mx-auto" />
        <h1 className="text-3xl font-bold text-white">ไม่พบภาพยนตร์</h1>
        <Link href="/" className="inline-block px-6 py-3 bg-brand-red hover:bg-brand-red-dark text-white rounded-full font-semibold transition-colors">
          กลับหน้าแรก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Top Cinematic Section */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] flex items-end">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src={backdropImage}
            alt="Backdrop"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
        </div>

        {/* Top Navigation */}
        <div className="absolute top-8 left-4 sm:left-8 z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-white/10 text-sm font-medium text-gray-300 hover:text-white hover:bg-black/80 backdrop-blur-md transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            กลับหน้าแรก
          </Link>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 flex flex-col md:flex-row gap-8 items-end">
          {/* Movie Poster Placeholder */}
          <div className="w-32 h-48 sm:w-48 sm:h-72 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-900 border border-white/10 shadow-2xl shadow-black/50 flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-gray-800" />
            ) : (
              <img
                src={backdropImage}
                alt="Poster"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 flex flex-col justify-end gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-3/4 sm:w-1/2 bg-gray-800" />
                <div className="flex gap-4">
                   <Skeleton className="h-6 w-24 bg-gray-800 rounded-full" />
                   <Skeleton className="h-6 w-32 bg-gray-800 rounded-full" />
                </div>
              </>
            ) : (
              <>
                {movie?.isActive && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red/20 border border-brand-red/30 text-brand-red text-xs font-bold w-fit backdrop-blur-sm shadow-[0_0_15px_rgba(227, 24, 55,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse shadow-[0_0_8px_rgba(227, 24, 55,0.8)]" />
                    Now Showing
                  </div>
                )}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-prompt leading-tight tracking-wide drop-shadow-lg">
                  {movie?.title}
                </h1>
                
                {/* Movie Meta Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-300 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-red" />
                    <span>
                      {movie && formatDate(movie.startDate)} — {movie && formatDate(movie.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-red" />
                    <span>120 นาที</span> {/* Hardcoded for MVP */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-red" />
                    <span>
                      เริ่มต้น <strong className="text-brand-red font-semibold text-base px-1">฿{movie?.basePrice.toFixed(0)}</strong>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Showtime Picker Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-3xl border border-white/5 bg-gray-900/50 backdrop-blur-md p-6 sm:p-10 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_10px_rgba(227, 24, 55,0.5)]" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-prompt tracking-wide">เลือกรอบฉาย</h2>
          </div>
          
          {!isLoading && movie ? (
             <ShowtimePicker movieId={movie.id} />
          ) : (
             <div className="space-y-6">
               <Skeleton className="h-10 w-full max-w-md bg-gray-800 rounded-full" />
               <Skeleton className="h-40 w-full bg-gray-800 rounded-2xl" />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
