import Link from 'next/link';
import { Calendar, Tag } from 'lucide-react';
import type { Movie } from '@/types/api';

interface MovieCardProps {
  movie: Movie;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function MovieCard({ movie }: MovieCardProps) {
  const placeholderImage = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop`;

  return (
    <Link href={`/movies/${movie.id}`}>
      <div className="relative group overflow-hidden rounded-2xl bg-[#0a0a0f] border border-white/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(227, 24, 55,0.3)] cursor-pointer h-[420px] w-full flex flex-col justify-end">
        {/* Background Image / Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={placeholderImage}
            alt={movie.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80"
          />
        </div>
        
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-300 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-red-dark/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>

        {/* Content */}
        <div className="relative p-6 z-10 flex flex-col justify-end h-full">
          {movie.isActive && (
            <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-brand-red/20 border border-brand-red/30 text-brand-red text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse shadow-[0_0_8px_rgba(227, 24, 55,0.8)]" />
              Now Showing
            </div>
          )}

          <div className="translate-y-6 group-hover:translate-y-0 transition-transform duration-500 ease-out">
            <h3 className="text-2xl font-bold text-white mb-3 tracking-wide line-clamp-2 drop-shadow-md">
              {movie.title}
            </h3>
            
            <div className="flex flex-col gap-2 mb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Calendar className="w-4 h-4 text-brand-red" />
                <span>
                  {formatDate(movie.startDate)} — {formatDate(movie.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Tag className="w-4 h-4 text-brand-red" />
                <span>
                  เริ่มต้น <strong className="text-brand-red">฿{movie.basePrice.toFixed(0)}</strong>
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-brand-red/20 hover:shadow-brand-red/40 text-sm">
              ดูรอบฉาย
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
