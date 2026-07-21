'use client';

import { useState, useMemo, useRef } from 'react';
import { MovieCard } from './MovieCard';
import type { Movie } from '@/types/api';
import { Film, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

interface PaginatedMovieGridProps {
  movies: Movie[];
}

export function PaginatedMovieGrid({ movies }: PaginatedMovieGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const sectionRef = useRef<HTMLDivElement>(null);

  const totalMovies = movies.length;
  const totalPages = Math.ceil(totalMovies / pageSize);

  const currentMovies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return movies.slice(start, start + pageSize);
  }, [movies, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (!movies.length) {
    return (
      <div className="text-center py-32 space-y-6 bg-gray-900/30 rounded-3xl border border-white/5 backdrop-blur-sm">
        <Film className="w-16 h-16 text-brand-red/50 mx-auto" />
        <p className="text-gray-400 text-lg">ยังไม่มีภาพยนตร์ที่เปิดให้จองในขณะนี้</p>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalMovies);

  return (
    <div ref={sectionRef} className="space-y-8 scroll-mt-24">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/60 border border-gray-800 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-lg">
        <div className="text-sm text-gray-400 font-medium flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-brand-red" />
          <span>
            แสดง <strong className="text-white font-semibold">{startItem} - {endItem}</strong> จากทั้งหมด{' '}
            <strong className="text-white font-semibold">{totalMovies}</strong> เรื่อง
          </span>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>แสดงต่อหน้า:</span>
          {[6, 8, 12, 16].map((size) => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                pageSize === size
                  ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {currentMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {/* Bottom Pagination Navigation */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-800/80">
          <div className="text-xs text-gray-400">
            หน้า <strong className="text-white">{currentPage}</strong> จาก{' '}
            <strong className="text-white">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>ก่อนหน้า</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1.5 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-brand-red to-brand-red-dark text-white shadow-lg shadow-brand-red/30 border border-brand-red-light scale-105'
                      : 'bg-gray-800/80 border border-gray-700/60 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
