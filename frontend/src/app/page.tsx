import { Suspense } from 'react';
import { MovieCardSkeleton } from '@/components/movies/MovieCardSkeleton';
import { SRSBookingFilterBar } from '@/components/booking/SRSBookingFilterBar';
import { PaginatedMovieGrid } from '@/components/movies/PaginatedMovieGrid';
import type { Movie } from '@/types/api';
import { Sparkles } from 'lucide-react';

async function getMovies(): Promise<Movie[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
    const res = await fetch(`${apiUrl}/api/movies?onlyActive=true`, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!res.ok) throw new Error('Failed to fetch movies');
    
    return res.json();
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

function MovieGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[1, 2, 3, 4].map((i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function MovieGrid() {
  const movies = await getMovies();
  return <PaginatedMovieGrid movies={movies} />;
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden min-h-[60vh] flex items-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(227, 24, 55,0.15),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm font-bold tracking-wide mb-6 shadow-[0_0_15px_rgba(227, 24, 55,0.1)]">
            <Sparkles className="w-4 h-4" />
            ยินดีต้อนรับสู่ประสบการณ์ระดับพรีเมียม
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-prompt text-white mb-6 tracking-tight drop-shadow-2xl">
            Nature{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-red-dark drop-shadow-[0_0_30px_rgba(227, 24, 55,0.3)]">
              MiniPlex
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 font-light">
            ที่สุดของโรงภาพยนตร์ส่วนตัว ศรีราชา &amp; บางแสน
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300 font-medium mb-8">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gray-900/80 border border-white/10 backdrop-blur-md shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-red shadow-[0_0_10px_rgba(227, 24, 55,0.8)]" />
              ศรีราชา · 6 ที่นั่ง
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gray-900/80 border border-white/10 backdrop-blur-md shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-red shadow-[0_0_10px_rgba(227, 24, 55,0.8)]" />
              บางแสน · 12 ที่นั่ง
            </div>
          </div>

          {/* SRS Filter Bar: เลือกเรื่องหนัง + เลือกวันที่ (รอบฉาย) + ค้นหา */}
          <SRSBookingFilterBar />
        </div>
        
        {/* Bottom fade out */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
      </section>

      <section className="relative bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-1.5 h-10 rounded-full bg-brand-red shadow-[0_0_15px_rgba(227, 24, 55,0.6)]" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-prompt tracking-wide">ภาพยนตร์ที่กำลังฉาย</h2>
          </div>
          
          <Suspense fallback={<MovieGridSkeleton />}>
            <MovieGrid />
          </Suspense>
        </div>
      </section>
    </>
  );
}

