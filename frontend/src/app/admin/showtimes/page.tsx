'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Lock, LockOpen, Clock, CalendarDays, Ticket, Film, Building2, CheckCircle2, Sparkles, Check } from 'lucide-react';

function formatDT(d?: string) {
  if (!d) return '-';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateOnly(d?: string) {
  if (!d) return '-';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const emptyForm: CreateShowtimeCommand = {
  movieId: 0, cinemaId: 0, showDateTime: '', ticketPrice: 0, isActive: true,
};

const SRS_PRESET_SLOTS = [
  { time: '10:00', label: '🌅 รอบเช้า', detail: '10:00 น.' },
  { time: '13:30', label: '☀️ รอบกลางวัน', detail: '13:30 น.' },
  { time: '17:30', label: '🌆 รอบเย็น', detail: '17:30 น.' },
  { time: '21:00', label: '🌙 รอบดึก', detail: '21:00 น.' },
];

export default function AdminShowtimesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);
  const [form, setForm] = useState<CreateShowtimeCommand>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Multi-slot creation state (SRS feature)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedSlots, setSelectedSlots] = useState<string[]>(['13:30']);

  const { data: showtimes = [], isLoading } = useQuery<Showtime[]>({
    queryKey: ['admin-showtimes'],
    queryFn: async () => {
      const { data } = await apiClient.get<Showtime[]>('/api/showtimes');
      return data ?? [];
    },
  });

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
    const firstMovie = movies.find(m => m.isActive) || movies[0];
    const firstCinema = cinemas[0];
    const todayStr = new Date().toISOString().slice(0, 10);
    
    setSelectedDate(todayStr);
    setSelectedSlots(['13:30']);
    setForm({
      movieId: firstMovie ? firstMovie.id : 0,
      cinemaId: firstCinema ? firstCinema.id : 0,
      showDateTime: `${todayStr}T13:30`,
      ticketPrice: firstMovie ? (firstMovie.basePrice ?? 0) : 100,
      isActive: true
    }); 
    setDialogOpen(true); 
  };
  
  const openEdit = (st: Showtime) => {
    setEditing(st);
    
    // แปลงวันที่และเวลาเดิมเพื่อไปใช้กับ UI ชุดใหม่
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
    setForm(f => ({
      ...f,
      movieId: movie.id,
      ticketPrice: !editing ? (movie.basePrice ?? 0) : f.ticketPrice
    }));
  };

  const toggleTimeSlot = (timeStr: string) => {
    if (editing) {
      // โหมดแก้ไข: อนุญาตให้เลือกได้แค่ 1 รอบเท่านั้น หากเลือกเวลาอื่นจะแทนที่ของเดิมทันที
      setSelectedSlots([timeStr]);
      return;
    }

    if (selectedSlots.includes(timeStr)) {
      if (selectedSlots.length === 1) {
        toast.warning('ต้องเลือกอย่างน้อย 1 รอบฉาย');
        return;
      }
      setSelectedSlots(selectedSlots.filter(s => s !== timeStr));
    } else {
      if (selectedSlots.length >= 3) {
        toast.error('ตามข้อกำหนด SRS: แต่ละโรงภาพยนตร์เลือกได้สูงสุด 3 รอบต่อวัน');
        return;
      }
      setSelectedSlots([...selectedSlots, timeStr].sort());
    }
  };

  const handleSubmit = async () => {
    if (!form.movieId || !form.cinemaId || form.ticketPrice <= 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return;
    }

    if (editing) {
      if (!selectedDate || selectedSlots.length === 0) {
        toast.error('กรุณากำหนดวันและเวลาฉาย'); return;
      }
      // นำ Date และ Slot ที่เลือกกลับมารวมเป็น showDateTime สำหรับโหมดแก้ไข
      const fullDateTime = `${selectedDate}T${selectedSlots[0]}:00`;
      updateMutation.mutate({ ...form, id: editing.id, showDateTime: fullDateTime }, { onSuccess: () => setDialogOpen(false) });
      return;
    }

    // Creating new showtimes with multi-slot batch creation (SRS Rule)
    if (!selectedDate || selectedSlots.length === 0) {
      toast.error('กรุณาเลือกวันที่และอย่างน้อย 1 รอบฉาย'); return;
    }

    const existingCountForDay = showtimes.filter(st => 
      st.cinemaId === form.cinemaId && 
      (st.showDateTime ?? '').slice(0, 10) === selectedDate
    ).length;

    if (existingCountForDay + selectedSlots.length > 3) {
      toast.error(`โรงภาพยนตร์นี้มีรอบฉายในวันที่เลือกแล้ว ${existingCountForDay} รอบ สามารถเพิ่มได้อีกไม่เกิน ${3 - existingCountForDay} รอบ (ข้อกำหนด SRS ไม่เกิน 3 รอบ/วัน)`);
      return;
    }

    const selectedMovie = movies.find(m => m.id === form.movieId);
    if (selectedMovie && selectedMovie.startDate && selectedMovie.endDate) {
      const showDate = new Date(selectedDate);
      const startDate = new Date(selectedMovie.startDate);
      const endDate = new Date(selectedMovie.endDate);
      
      showDate.setHours(0,0,0,0);
      startDate.setHours(0,0,0,0);
      endDate.setHours(0,0,0,0);

      if (showDate < startDate || showDate > endDate) {
        toast.warning('ข้อควรระวัง: รอบฉายอยู่นอกช่วงเวลาเข้าฉายของภาพยนตร์');
      }
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
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'เกิดข้อผิดพลาดในการเพิ่มรอบฉาย');
    }
  };

  const toggleIsActive = (st: Showtime) => {
    updateMutation.mutate({
      id: st.id,
      movieId: st.movieId ?? 0,
      cinemaId: st.cinemaId ?? 0,
      showDateTime: (st.showDateTime ?? '').slice(0, 16),
      ticketPrice: st.ticketPrice ?? 0,
      isActive: !st.isActive
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedMovie = movies.find(m => m.id === form.movieId);
  const selectedCinema = cinemas.find(c => c.id === form.cinemaId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-brand-red" />
          <h1 className="text-2xl font-bold text-white font-prompt">จัดการรอบฉาย</h1>
        </div>
        <Button onClick={openAdd} className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20 px-5 py-2.5">
          <Plus className="w-4 h-4 mr-2" />เพิ่มรอบฉายใหม่
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-DEFAULT overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>
        ) : !showtimes.length ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
            <Clock className="w-12 h-12 text-surface-border" />
            <p className="text-lg font-medium text-white">ยังไม่มีรอบฉาย</p>
            <p className="text-sm">กดเพิ่มรอบฉายเพื่อเริ่มต้นจัดการระบบ</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-surface-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">ภาพยนตร์</TableHead>
                <TableHead className="text-muted-foreground">โรงหนัง</TableHead>
                <TableHead className="text-muted-foreground">วันและเวลาฉาย</TableHead>
                <TableHead className="text-muted-foreground">ราคาตั๋ว</TableHead>
                <TableHead className="text-muted-foreground">สถานะ</TableHead>
                <TableHead className="text-right text-muted-foreground">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showtimes.map((st) => (
                <TableRow key={st.id} className="border-surface-border hover:bg-surface-elevated transition-colors">
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-base border border-surface-border flex items-center justify-center text-brand-red">
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{st.movie?.title ?? `Movie #${st.movieId}`}</span>
                        {st.isLocked && <span className="text-[10px] text-yellow-500 font-bold tracking-wider">LOCKED</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground/70" />
                      <span>{st.cinema?.name ?? `Cinema #${st.cinemaId}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-brand-red/80" />
                      <span className="text-white font-mono text-sm">{formatDT(st.showDateTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-brand-red font-semibold text-base">฿{(st.ticketPrice ?? 0).toFixed(0)}</TableCell>
                  <TableCell>
                    <label className="inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={Boolean(st.isActive)} 
                        onChange={() => toggleIsActive(st)}
                        disabled={updateMutation.isPending || Boolean(st.isLocked)}
                      />
                      <div className="relative w-11 h-6 bg-surface-base rounded-full peer peer-checked:bg-brand-red border border-surface-border transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 group-hover:after:scale-95 disabled:opacity-50"></div>
                      <span className={`ml-3 text-sm font-medium ${st.isActive ? 'text-brand-red' : 'text-muted-foreground'}`}>
                        {st.isActive ? 'เปิดจอง' : 'ปิดจอง'}
                      </span>
                    </label>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost"
                        onClick={() => lockMutation.mutate({ id: st.id, isLocked: !st.isLocked })}
                        className={st.isLocked ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-muted-foreground hover:text-yellow-400'}
                        title={st.isLocked ? 'ปลดล็อค' : 'ล็อครอบฉาย'}
                      >
                        {st.isLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(st)}
                        className="text-muted-foreground hover:text-white hover:bg-surface-elevated">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => { setDeleteId(st.id); setDeleteOpen(true); }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modern User-Friendly Dialog for Adding / Editing Showtime */}
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
                <span className="text-xs text-muted-foreground">คลิกเลือกจากรายการ</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {movies.map((m) => {
                  const isSelected = form.movieId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMovie(m)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-brand-red/10 border-brand-red text-white shadow-md shadow-brand-red/10'
                          : 'bg-surface-base border-surface-border text-muted-foreground hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-brand-red text-white' : 'bg-surface-elevated text-muted-foreground'
                      }`}>
                        <Film className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-white">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateOnly(m.startDate)} - {formatDateOnly(m.endDate)}
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
                })}
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
                      className={`p-3.5 rounded-xl border font-medium text-sm flex items-center justify-between transition-all ${
                        isSelected
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

            {/* Step 3: Visual Date & Time Picker (Unified) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-bold text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-brand-red" />
                  {editing ? '3. กำหนดวันและเลือกรอบฉาย' : '3. กำหนดวันและเลือกรอบฉาย (1-3 รอบ/วัน)'}
                </Label>
                {!editing && (
                  <span className="text-xs font-semibold text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full border border-brand-red/20">
                    เลือก {selectedSlots.length}/3 รอบ
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">เลือกวันที่ต้องการจัดรอบฉาย:</span>
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-surface-base border-surface-border text-white focus-visible:ring-brand-red h-11" 
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-muted-foreground">
                  {editing ? 'คลิกเลือกรอบฉายที่ต้องการแก้ไข:' : 'คลิกเลือก/ยกเลิกรอบฉายที่ต้องการจัด (ตามข้อกำหนด SRS):'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SRS_PRESET_SLOTS.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.time);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => toggleTimeSlot(slot.time)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-brand-red/20 border-brand-red text-white shadow-md shadow-brand-red/20 ring-1 ring-brand-red'
                            : 'bg-surface-base border-surface-border text-muted-foreground hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-bold">{slot.label}</span>
                          <span className={`text-[11px] ${isSelected ? 'text-brand-red' : 'text-muted-foreground'}`}>{slot.detail}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-red" />}
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

              <div className="space-y-2 flex flex-col justify-end">
                <div className="h-11 flex items-center justify-between px-4 rounded-xl border border-surface-border bg-surface-base">
                  <span className="text-sm font-medium text-white">เปิดให้จองตั๋วทันที</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={Boolean(form.isActive)} 
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    <div className="relative w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-brand-red border border-surface-border transition-colors after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
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
                      วันที่ {formatDateOnly(selectedDate)}
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-surface-elevated border-surface-border text-white sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-white text-xl">ยืนยันการลบ</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm py-3">คุณแน่ใจหรือไม่ที่จะลบรอบฉายนี้? ข้อมูลจะไม่สามารถกู้คืนได้</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}
              className="border-surface-border text-muted-foreground hover:text-white">ยกเลิก</Button>
            <Button variant="destructive" onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteOpen(false) });
                }
              }}
              disabled={deleteMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}ยืนยันลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}