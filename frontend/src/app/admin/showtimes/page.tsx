'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import apiClient from '@/lib/axios';
import type { Showtime, Movie, Cinema, CreateShowtimeCommand } from '@/types/api';
import { useCreateShowtime } from '@/features/showtimes/hooks/useCreateShowtime';
import { useUpdateShowtime } from '@/features/showtimes/hooks/useUpdateShowtime';
import { useDeleteShowtime } from '@/features/showtimes/hooks/useDeleteShowtime';
import { useLockShowtime } from '@/features/showtimes/hooks/useLockShowtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { toast } from '@/store/useToastStore';
import { confirmModal } from '@/store/useConfirmStore';
import { Plus, Pencil, Trash2, Loader2, Lock, LockOpen, Clock, CalendarDays, Ticket, Film, Building2, CheckCircle2, Sparkles, Check, AlertTriangle, Search } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { formatDate, formatDateTime } from '@/lib/utils';

const emptyForm: CreateShowtimeCommand = {
  movieId: 0, cinemaId: 0, showDateTime: '', ticketPrice: 0, isActive: true,
};

const SRS_PRESET_SLOTS = [
  { id: 'morning', time: '10:00', label: '🌅 รอบเช้า', detail: '10:00 น.' },
  { id: 'afternoon', time: '13:30', label: '☀️ รอบกลางวัน', detail: '13:30 น.' },
  { id: 'evening', time: '17:30', label: '🌆 รอบเย็น', detail: '17:30 น.' },
  { id: 'night', time: '20:30', label: '🌙 รอบดึก', detail: '20:30 น.' },
];

export default function AdminShowtimesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);
  const [form, setForm] = useState<CreateShowtimeCommand>(emptyForm);
  const [movieSearchQuery, setMovieSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Multi-slot creation state (SRS feature)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['13:30']);

  const { data: showtimes = [], isLoading } = useQuery<Showtime[]>({
    queryKey: ['admin-showtimes'],
    queryFn: async () => {
      const { data } = await apiClient.get<Showtime[]>('/api/showtimes?pageSize=100&includeInactive=true');
      return data ?? [];
    },
  });

  const totalPages = Math.ceil(showtimes.length / pageSize) || 1;
  const paginatedShowtimes = showtimes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { data: movies = [] } = useQuery<Movie[]>({
    queryKey: ['movies', false],
    queryFn: async () => {
      const { data } = await apiClient.get<Movie[]>('/api/movies', { params: { onlyActive: false } });
      return data ?? [];
    },
  });

  const { data: cinemas = [] } = useQuery<Cinema[]>({
    queryKey: ['cinemas'],
    queryFn: async () => {
      const { data } = await apiClient.get<Cinema[]>('/api/cinemas');
      return data ?? [];
    },
  });

  const createMutation = useCreateShowtime();
  const updateMutation = useUpdateShowtime();
  const deleteMutation = useDeleteShowtime();
  const lockMutation = useLockShowtime();

  const openAdd = () => {
    setEditing(null);
    setMovieSearchQuery('');
    const activeMovies = movies.filter(m => m.isActive);
    const firstMovie = activeMovies[0];
    const firstCinema = cinemas[0];
    const defaultDate = firstMovie?.startDate ? firstMovie.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

    const inDbSlots = showtimes
      .filter(st => st.cinemaId === (firstCinema?.id ?? 0) && (st.showDateTime ?? '').slice(0, 10) === defaultDate)
      .map(st => (st.showDateTime ?? '').slice(11, 16));

    const firstAvail = SRS_PRESET_SLOTS.find(s => !inDbSlots.includes(s.time));
    const initialSlots = firstAvail ? [firstAvail.time] : [];

    setSelectedDate(defaultDate);
    setSelectedSlots(initialSlots);
    setForm({
      movieId: firstMovie ? firstMovie.id : 0,
      cinemaId: firstCinema ? firstCinema.id : 0,
      showDateTime: initialSlots.length > 0 ? `${defaultDate}T${initialSlots[0]}` : `${defaultDate}T13:30`,
      ticketPrice: firstMovie ? (firstMovie.basePrice ?? 0) : 100,
      isActive: true
    });
    setDialogOpen(true);
  };

  const openEdit = (st: Showtime) => {
    setEditing(st);
    setMovieSearchQuery('');

    const dtString = (st.showDateTime ?? '').slice(0, 16);
    const [d, t] = dtString.split('T');

    setSelectedDate(d || new Date().toISOString().slice(0, 10));
    setSelectedSlots(t ? [t] : ['13:30']);

    setForm({
      movieId: st.movieId ?? 0,
      cinemaId: st.cinemaId ?? 0,
      showDateTime: dtString,
      ticketPrice: st.ticketPrice ?? 0,
      isActive: Boolean(st.isActive),
    });
    setDialogOpen(true);
  };

  const handleSelectMovie = (movie: Movie) => {
    const startStr = movie.startDate ? movie.startDate.slice(0, 10) : '';
    const endStr = movie.endDate ? movie.endDate.slice(0, 10) : '';

    if (startStr && (selectedDate < startStr || selectedDate > endStr)) {
      setSelectedDate(startStr);
    }

    setForm(f => ({
      ...f,
      movieId: movie.id,
      ticketPrice: !editing ? (movie.basePrice ?? 0) : f.ticketPrice
    }));
  };

  const existingShowtimesForDate = showtimes.filter(st =>
    st.cinemaId === form.cinemaId &&
    (st.showDateTime ?? '').slice(0, 10) === selectedDate &&
    (!editing || st.id !== editing.id)
  );

  const existingTimeSlots = existingShowtimesForDate.map(st =>
    (st.showDateTime ?? '').slice(11, 16)
  );

  const existingCountForDay = existingShowtimesForDate.length;

  const toggleTimeSlot = (timeStr: string) => {
    if (existingTimeSlots.includes(timeStr)) {
      toast.warning(`รอบฉายเวลา ${timeStr} น. มีอยู่ในระบบแล้วสำหรับโรงภาพยนตร์นี้ ไม่สามารถจัดซ้ำได้`);
      return;
    }

    if (editing) {
      setSelectedSlots([timeStr]);
      return;
    }

    if (selectedSlots.includes(timeStr)) {
      setSelectedSlots(selectedSlots.filter(s => s !== timeStr));
    } else {
      const totalCount = existingCountForDay + selectedSlots.length;
      if (totalCount >= 3) {
        toast.error(`ตามข้อกำหนด SRS: แต่ละโรงภาพยนตร์จัดได้สูงสุด 3 รอบต่อวัน (ขณะนี้มีแล้ว ${existingCountForDay} รอบ, เลือกเพิ่ม ${selectedSlots.length} รอบ)`);
        return;
      }
      setSelectedSlots([...selectedSlots, timeStr].sort());
    }
  };

  const handleSubmit = async () => {
    if (!form.movieId || !form.cinemaId || form.ticketPrice <= 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return;
    }

    const selectedMovie = movies.find(m => m.id === form.movieId);
    if (selectedMovie && selectedMovie.startDate && selectedMovie.endDate) {
      const startStr = selectedMovie.startDate.slice(0, 10);
      const endStr = selectedMovie.endDate.slice(0, 10);

      if (selectedDate < startStr || selectedDate > endStr) {
        toast.error(`ไม่สามารถจัดรอบฉายได้: วันที่เลือก (${selectedDate}) อยู่นอกช่วงเวลาฉายของหนังเรื่องนี้ (${startStr} ถึง ${endStr})`);
        return;
      }
    }

    if (editing) {
      if (!selectedDate || selectedSlots.length === 0) {
        toast.error('กรุณากำหนดวันและเวลาฉาย'); return;
      }
      const targetTime = selectedSlots[0];
      if (existingTimeSlots.includes(targetTime)) {
        toast.error(`ไม่สามารถเปลี่ยนรอบฉายได้: โรงภาพยนตร์นี้มีรอบฉายเวลา ${targetTime} น. ในวันที่เลือกอยู่แล้ว`);
        return;
      }
      const fullDateTime = `${selectedDate}T${targetTime}:00`;
      updateMutation.mutate({ ...form, id: editing.id, showDateTime: fullDateTime }, {
        onSuccess: () => {
          toast.success('แก้ไขรอบฉายสำเร็จ');
          setDialogOpen(false);
        }
      });
      return;
    }

    if (!selectedDate || selectedSlots.length === 0) {
      toast.error('กรุณาเลือกรอบฉายที่ต้องการเพิ่มอย่างน้อย 1 รอบ'); return;
    }

    if (existingCountForDay >= 3) {
      toast.error(`โรงภาพยนตร์นี้ในวันที่ ${selectedDate} มีรอบฉายครบ 3 รอบแล้ว ไม่สามารถเพิ่มได้อีก`);
      return;
    }

    try {
      const promises = selectedSlots.map(timeStr => {
        const fullDateTime = `${selectedDate}T${timeStr}:00`;
        return apiClient.post('/api/showtimes', {
          movieId: form.movieId,
          cinemaId: form.cinemaId,
          showDateTime: fullDateTime,
          ticketPrice: form.ticketPrice,
          isActive: form.isActive
        });
      });

      await Promise.all(promises);
      void queryClient.invalidateQueries({ queryKey: ['admin-showtimes'] });
      toast.success(`เพิ่มรอบฉายสำเร็จ ${selectedSlots.length} รอบ`);
      setDialogOpen(false);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      toast.error(message ?? 'เกิดข้อผิดพลาดในการเพิ่มรอบฉาย');
    }
  };

  // 1. Toggle Active State with Centered Confirm Modal
  const toggleIsActive = (st: Showtime) => {
    const targetStatus = !st.isActive;
    const statusText = targetStatus ? 'เปิดให้จอง' : 'ปิดให้จอง';

    confirmModal({
      title: `ยืนยันการเปลี่ยนสถานะเป็น "${statusText}"`,
      description: `คุณต้องการเปลี่ยนสถานะรอบฉายนี้เป็น ${statusText} ใช่หรือไม่?`,
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      variant: 'primary',
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          updateMutation.mutate(
            {
              id: st.id,
              movieId: st.movieId ?? 0,
              cinemaId: st.cinemaId ?? 0,
              showDateTime: (st.showDateTime ?? '').slice(0, 16),
              ticketPrice: st.ticketPrice ?? 0,
              isActive: targetStatus,
            },
            {
              onSuccess: () => {
                toast.success(`เปลี่ยนสถานะรอบฉายเป็น ${statusText} เรียบร้อยแล้ว`);
                resolve();
              },
              onError: reject,
            }
          );
        });
      },
    });
  };

  // 2. Lock / Unlock Showtime with Centered Confirm Modal
  const handleLockToggle = (st: Showtime) => {
    const targetLock = !st.isLocked;
    const actionText = targetLock ? 'ล็อครอบฉาย' : 'ปลดล็อครอบฉาย';

    confirmModal({
      title: `ยืนยันการ${actionText}`,
      description: targetLock
        ? 'คุณต้องการล็อครอบฉายนี้ใช่หรือไม่? (รอบฉายที่ถูกล็อคจะไม่สามารถแก้ไขหรือเปลี่ยนสถานะได้)'
        : 'คุณต้องการปลดล็อครอบฉายนี้เพื่อให้สามารถแก้ไขข้อมูลได้ตามปกติใช่หรือไม่?',
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      variant: targetLock ? 'warning' : 'primary',
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          lockMutation.mutate(
            { id: st.id, isLocked: targetLock },
            {
              onSuccess: () => {
                toast.success(`${actionText}เรียบร้อยแล้ว`);
                resolve();
              },
              onError: reject,
            }
          );
        });
      },
    });
  };

  // 3. Delete Showtime with Centered Confirm Modal
  const handleDeleteClick = (st: Showtime) => {
    confirmModal({
      title: 'ยืนยันการลบรอบฉาย',
      description: 'คุณแน่ใจหรือไม่ที่จะลบรอบฉายนี้? ข้อมูลรอบฉายจะถูกลบออกจากระบบ',
      confirmText: 'ลบรอบฉาย',
      cancelText: 'ยกเลิก',
      variant: 'destructive',
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          deleteMutation.mutate(st.id, {
            onSuccess: () => {
              toast.success('ลบรอบฉายเรียบร้อยแล้ว');
              resolve();
            },
            onError: reject,
          });
        });
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedMovie = movies.find(m => m.id === form.movieId);
  const selectedCinema = cinemas.find(c => c.id === form.cinemaId);

  return (
    <PermissionGuard requiredPermissions={['showtimes:read', 'showtimes:create', 'showtimes:update', 'showtimes:cancel', 'showtimes:lock', 'showtime:create']} requireAll={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
            <div>
              <h1 className="text-2xl font-bold text-white font-prompt">จัดการรอบฉายภาพยนตร์</h1>
              <p className="text-xs text-gray-400">กำหนดรอบฉาย ล็อกรอบฉาย และผูกภาพยนตร์เข้ากับโรงภาพยนตร์ประจำสาขา</p>
            </div>
          </div>
          <PermissionGuard requiredPermission="showtimes:create">
            <Button onClick={openAdd} className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt shadow-[0_0_14px_rgba(227,24,55,0.3)] px-5 py-2.5 transition-all">
              <Plus className="w-4 h-4 mr-2" />เพิ่มรอบฉายใหม่
            </Button>
          </PermissionGuard>
        </div>

        <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl min-h-[480px] flex flex-col justify-between">
          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>
          ) : !showtimes.length ? (
            <div className="flex flex-col items-center py-24 text-gray-400 gap-3">
              <Clock className="w-12 h-12 text-gray-600" />
              <p className="text-lg font-medium text-white font-prompt">ยังไม่มีรอบฉายในระบบ</p>
              <p className="text-xs text-gray-500 font-prompt">กดปุ่มเพิ่มรอบฉายใหม่เพื่อเริ่มต้นกำหนดตารางฉาย</p>
            </div>
          ) : (
            <div className="flex-1">
              <Table>
                <TableHeader className="bg-[#0A0A0F]/60 border-b border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-prompt">ภาพยนตร์</TableHead>
                    <TableHead className="text-gray-400 font-prompt">โรงภาพยนตร์</TableHead>
                    <TableHead className="text-gray-400 font-prompt">วันและเวลาฉาย</TableHead>
                    <TableHead className="text-gray-400 font-prompt">ราคาตั๋ว</TableHead>
                    <TableHead className="text-gray-400 font-prompt">สถานะเปิดจอง</TableHead>
                    <PermissionGuard requiredPermissions={['showtimes:update', 'showtimes:lock', 'showtimes:cancel']} requireAll={false}>
                      <TableHead className="text-right text-gray-400 font-prompt">การจัดการ</TableHead>
                    </PermissionGuard>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedShowtimes.map((st) => {
                    const displayMovieTitle = st.movieTitle || st.movie?.title || movies.find(m => m.id === st.movieId)?.title || `ภาพยนตร์ #${st.movieId}`;
                    const displayCinemaName = st.cinemaName || st.cinema?.name || cinemas.find(c => c.id === st.cinemaId)?.name || (st.cinemaId === 1 ? 'โรงหนังศรีราชา' : 'โรงหนังบางแสน');

                    return (
                      <TableRow key={st.id} className="border-[#2A2A3E] hover:bg-gray-800/40 transition-colors">
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0A0A0F] border border-[#2A2A3E] flex items-center justify-center text-brand-red">
                              <Film className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-white font-prompt">{displayMovieTitle}</span>
                              {st.isLocked && <span className="text-[10px] text-amber-400 font-bold tracking-wider font-mono">LOCKED (ล็อกรอบ)</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            <span className="font-medium text-white text-xs font-prompt">{displayCinemaName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4 text-brand-red" />
                            <span className="text-white font-mono text-xs">{formatDateTime(st.showDateTime)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-brand-red font-bold font-mono text-base">฿{(st.ticketPrice ?? 0).toFixed(0)}</TableCell>
                        <TableCell>
                          {/* Premium Cinema Segmented Status Card with PermissionGuard */}
                          <PermissionGuard requiredPermission="showtimes:update" mode="disable">
                            <button
                              type="button"
                              aria-pressed={Boolean(st.isActive)}
                              onClick={() => toggleIsActive(st)}
                              disabled={updateMutation.isPending || Boolean(st.isLocked)}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-prompt transition-all ${
                                st.isActive
                                  ? 'bg-brand-red/15 border-brand-red text-brand-red shadow-[0_0_10px_rgba(227,24,55,0.2)]'
                                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                              }`}
                            >
                              {st.isActive ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" />
                                  <span>เปิดจองปกติ</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />
                                  <span>ปิดจองชั่วคราว</span>
                                </>
                              )}
                            </button>
                          </PermissionGuard>
                        </TableCell>
                        <PermissionGuard requiredPermissions={['showtimes:update', 'showtimes:lock', 'showtimes:cancel']} requireAll={false}>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <PermissionGuard requiredPermission="showtimes:lock">
                                <Button size="sm" variant="ghost"
                                  onClick={() => handleLockToggle(st)}
                                  className={st.isLocked ? 'text-amber-400 hover:bg-amber-950/40 text-xs' : 'text-gray-400 hover:text-amber-400 hover:bg-gray-800 text-xs'}
                                  title={st.isLocked ? 'ปลดล็อค' : 'ล็อครอบฉาย'}
                                >
                                  {st.isLocked ? <Lock className="w-3.5 h-3.5 mr-1 text-amber-400" /> : <LockOpen className="w-3.5 h-3.5 mr-1" />}
                                  <span>{st.isLocked ? 'ปลดล็อก' : 'ล็อก'}</span>
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission="showtimes:update">
                                <Button size="sm" variant="ghost" onClick={() => openEdit(st)}
                                  className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs">
                                  <Pencil className="w-3.5 h-3.5 mr-1" />
                                  <span>แก้ไข</span>
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard requiredPermission="showtimes:cancel">
                                <Button size="sm" variant="ghost"
                                  onClick={() => handleDeleteClick(st)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs">
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  <span>ยกเลิก</span>
                                </Button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </PermissionGuard>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Shadcn UI Pagination with smooth event handlers */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#2A2A3E] bg-[#0A0A0F]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                แสดงรอบฉาย {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, showtimes.length)} จากทั้งหมด {showtimes.length} รอบ
              </span>
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      disabled={currentPage === 1}
                      className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        type="button"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        className={currentPage === page ? 'bg-brand-red text-white border-brand-red shadow-[0_0_10px_rgba(227,24,55,0.3)] cursor-default' : 'border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer'}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      disabled={currentPage === totalPages}
                      className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

      {/* Dialog for Adding / Editing Showtime */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface-elevated border-surface-border text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-surface-border pb-4">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-red" />
              {editing ? 'แก้ไขรอบฉาย' : 'จัดรอบฉายใหม่'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1: Visual Movie Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-bold text-sm flex items-center gap-2">
                  <Film className="w-4 h-4 text-brand-red" />
                  1. เลือกภาพยนตร์
                </Label>
                <span className="text-xs text-muted-foreground">ค้นหาหรือคลิกเลือกจากรายการ</span>
              </div>

              {/* Search Box for 10+ Movies */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อภาพยนตร์ (รองรับ 10+ เรื่อง)..."
                  value={movieSearchQuery}
                  onChange={(e) => setMovieSearchQuery(e.target.value)}
                  className="pl-9 bg-surface-base border-surface-border text-white text-xs h-9 focus-visible:ring-brand-red placeholder:text-muted-foreground/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {movies.filter(m => m.isActive || (editing && m.id === editing.movieId)).length === 0 ? (
                  <div className="col-span-2 p-4 bg-yellow-950/40 border border-yellow-800/60 rounded-xl text-yellow-200 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span>ไม่มีภาพยนตร์ที่เปิดฉายอยู่ กรุณาเปิดฉายภาพยนตร์ในหน้า &quot;จัดการภาพยนตร์&quot; ก่อนจัดรอบฉาย</span>
                  </div>
                ) : movies
                    .filter(m => m.isActive || (editing && m.id === editing.movieId))
                    .filter(m => m.title.toLowerCase().includes(movieSearchQuery.trim().toLowerCase())).length === 0 ? (
                  <div className="col-span-2 p-4 bg-surface-base border border-surface-border rounded-xl text-muted-foreground text-xs text-center">
                    ไม่พบภาพยนตร์ที่ตรงกับคำค้นหา &quot;{movieSearchQuery}&quot;
                  </div>
                ) : (
                  movies
                    .filter(m => m.isActive || (editing && m.id === editing.movieId))
                    .filter(m => m.title.toLowerCase().includes(movieSearchQuery.trim().toLowerCase()))
                    .map((m) => {
                      const isSelected = form.movieId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectMovie(m)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative ${isSelected
                            ? 'bg-brand-red/10 border-brand-red text-white shadow-md shadow-brand-red/10 ring-1 ring-brand-red'
                            : 'bg-surface-base border-surface-border text-muted-foreground hover:border-white/20 hover:text-white'
                            }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-brand-red text-white' : 'bg-surface-elevated text-muted-foreground'
                            }`}>
                            <Film className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate text-white">{m.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(m.startDate)} - {formatDate(m.endDate)}
                            </p>
                            <p className="text-xs font-bold text-brand-red mt-0.5">
                              ราคาตั้งต้น ฿{(m.basePrice ?? 0).toFixed(0)}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-brand-red absolute top-3 right-3" />
                          )}
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Step 2: Visual Cinema Selector Chips */}
            <div className="space-y-3">
              <Label className="text-white font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-red" />
                2. เลือกโรงภาพยนตร์
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cinemas.map((c) => {
                  const isSelected = form.cinemaId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, cinemaId: c.id }))}
                      className={`p-3.5 rounded-xl border font-medium text-sm flex items-center justify-between transition-all ${isSelected
                        ? 'bg-brand-red/15 border-brand-red text-white shadow-md shadow-brand-red/10 ring-1 ring-brand-red'
                        : 'bg-surface-base border-surface-border text-muted-foreground hover:border-white/20 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${isSelected ? 'text-brand-red' : 'text-muted-foreground'}`} />
                        <span>{c.name}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-red" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Visual Date & Time Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-bold text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-brand-red" />
                  {editing ? '3. กำหนดวันและเลือกรอบฉาย' : '3. กำหนดวันและเลือกรอบฉาย (1-3 รอบ/วัน)'}
                </Label>
                {!editing && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${existingCountForDay >= 3
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-brand-red/10 text-brand-red border-brand-red/20'
                    }`}>
                    {existingCountForDay >= 3
                      ? 'ครบ 3 รอบแล้ว'
                      : `เลือก ${selectedSlots.length} รอบ (คงเหลือ ${3 - existingCountForDay} รอบ)`}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    เลือกวันที่ต้องการจัดรอบฉาย: {selectedDate && (
                      <span className="text-brand-red font-mono font-bold ml-1">({formatDate(selectedDate)})</span>
                    )}
                  </span>
                  {selectedMovie?.startDate && selectedMovie?.endDate && (
                    <span className="text-[11px] text-brand-red font-semibold">
                      ช่วงฉาย: {formatDate(selectedMovie.startDate)} - {formatDate(selectedMovie.endDate)}
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  min={selectedMovie?.startDate ? selectedMovie.startDate.slice(0, 10) : undefined}
                  max={selectedMovie?.endDate ? selectedMovie.endDate.slice(0, 10) : undefined}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-surface-base border-surface-border text-white focus-visible:ring-brand-red h-11"
                />
              </div>

              {/* Day Full Warning */}
              {existingCountForDay >= 3 && !editing && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>วันที่ {selectedDate} ในโรงนี้จัดรอบฉายครบ 3 รอบแล้ว (ข้อกำหนด SRS) ไม่สามารถเลือกเพิ่มได้อีก</span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-muted-foreground">
                  {editing ? 'คลิกเลือกรอบฉายที่ต้องการแก้ไข:' : 'คลิกเลือก/ยกเลิกรอบฉายที่ต้องการจัด (ตามข้อกำหนด SRS):'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SRS_PRESET_SLOTS.map((slot) => {
                    const isExisting = existingTimeSlots.includes(slot.time);
                    const isSelected = selectedSlots.includes(slot.time);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => toggleTimeSlot(slot.time)}
                        disabled={isExisting}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${isExisting
                          ? 'bg-gray-900 border-gray-800 text-gray-500 cursor-not-allowed opacity-80'
                          : isSelected
                            ? 'bg-brand-red/20 border-brand-red text-white shadow-md shadow-brand-red/20 ring-1 ring-brand-red cursor-pointer'
                            : 'bg-surface-base border-surface-border text-muted-foreground hover:border-white/20 hover:text-white cursor-pointer'
                          }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold">{slot.label}</span>
                          <span className={`text-[11px] ${isExisting ? 'text-gray-500 font-mono' : isSelected ? 'text-brand-red' : 'text-muted-foreground'}`}>
                            {isExisting ? '✓ มีในระบบแล้ว' : slot.detail}
                          </span>
                        </div>
                        {isExisting ? (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">จัดแล้ว</span>
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-brand-red" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-white font-bold text-sm flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-brand-red" />
                  4. ราคาตั๋ว (บาท)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={form.ticketPrice}
                    onChange={(e) => setForm((f) => ({ ...f, ticketPrice: Number(e.target.value) }))}
                    className="bg-surface-base border-surface-border text-white pl-9 focus-visible:ring-brand-red h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs text-gray-300 font-prompt">สถานะการเปิดให้จองตั๋ว:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-pressed={Boolean(form.isActive)}
                    onClick={() => setForm((f) => ({ ...f, isActive: true }))}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-bold font-prompt ${
                      form.isActive
                        ? 'bg-brand-red/20 border-brand-red text-brand-red shadow-[0_0_12px_rgba(227,24,55,0.25)]'
                        : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${form.isActive ? 'text-brand-red' : 'text-gray-600'}`} />
                    <span>เปิดให้จองตั๋วทันที</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={!form.isActive}
                    onClick={() => setForm((f) => ({ ...f, isActive: false }))}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-bold font-prompt ${
                      !form.isActive
                        ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                        : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${!form.isActive ? 'text-red-400' : 'text-gray-600'}`} />
                    <span>ปิดจองชั่วคราว</span>
                  </button>
                </div>
              </div>
            </div>

            {selectedMovie && selectedCinema && (
              <div className="p-4 rounded-xl border border-brand-red/30 bg-brand-red/5 space-y-2">
                <p className="text-xs font-bold text-brand-red uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> ตรวจสอบข้อมูลการจัดรอบฉาย
                </p>
                <div className="flex flex-wrap items-center justify-between text-sm gap-2">
                  <div>
                    <span className="font-bold text-white text-base">{selectedMovie.title}</span>
                    <span className="text-muted-foreground ml-2">({selectedCinema.name})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground text-xs block">
                      วันที่ {formatDate(selectedDate)}
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {selectedSlots.length > 0 ? selectedSlots.map(s => `${s} น.`).join(', ') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-surface-border">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}
              className="border-surface-border text-muted-foreground hover:text-white">ยกเลิก</Button>
            <Button onClick={handleSubmit} disabled={isPending}
              className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20 px-6">
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันการเพิ่มรอบฉาย'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </PermissionGuard>
  );
}