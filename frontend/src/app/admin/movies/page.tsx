'use client';

import { useState } from 'react';
import type { Movie, CreateMovieCommand } from '@/types/api';
import { useMovies } from '@/features/movies/hooks/useMovies';
import { useCreateMovie } from '@/features/movies/hooks/useCreateMovie';
import { useUpdateMovie } from '@/features/movies/hooks/useUpdateMovie';
import { useDeleteMovie } from '@/features/movies/hooks/useDeleteMovie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Film } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

const emptyForm: CreateMovieCommand = {
  title: '',
  startDate: '',
  endDate: '',
  basePrice: 0,
  isActive: true,
};

export default function AdminMoviesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState<CreateMovieCommand>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: movies = [], isLoading } = useMovies(false); // Fetch ALL movies (including inactive)
  const createMutation = useCreateMovie();
  const updateMutation = useUpdateMovie();
  const deleteMutation = useDeleteMovie();

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (movie: Movie) => {
    setEditing(movie);
    setForm({
      title: movie.title,
      startDate: movie.startDate.slice(0, 10),
      endDate: movie.endDate.slice(0, 10),
      basePrice: movie.basePrice,
      isActive: movie.isActive,
    });
    setDialogOpen(true);
  };

  const toggleIsActive = (movie: Movie) => {
    updateMutation.mutate({
      id: movie.id,
      title: movie.title,
      startDate: movie.startDate.slice(0, 10),
      endDate: movie.endDate.slice(0, 10),
      basePrice: movie.basePrice,
      isActive: !movie.isActive
    });
  };

  const handleSubmit = () => {
    if (!form.title || !form.startDate || !form.endDate || form.basePrice <= 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id }, {
        onSuccess: () => setDialogOpen(false)
      });
    } else {
      createMutation.mutate(form, {
        onSuccess: () => setDialogOpen(false)
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-brand-red" />
          <h1 className="text-2xl font-bold text-white font-prompt">จัดการภาพยนตร์</h1>
        </div>
        <Button
          onClick={openAdd}
          className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มภาพยนตร์
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface-DEFAULT overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
          </div>
        ) : !movies.length ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
            <Film className="w-12 h-12" />
            <p>ยังไม่มีภาพยนตร์</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-surface-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">ชื่อ</TableHead>
                <TableHead className="text-muted-foreground">วันเริ่ม</TableHead>
                <TableHead className="text-muted-foreground">วันสิ้นสุด</TableHead>
                <TableHead className="text-muted-foreground">ราคา</TableHead>
                <TableHead className="text-muted-foreground">สถานะ</TableHead>
                <TableHead className="text-right text-muted-foreground">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movies.map((movie) => (
                <TableRow key={movie.id} className="border-surface-border hover:bg-surface-elevated">
                  <TableCell className="text-white font-medium">{movie.title}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(movie.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(movie.endDate)}</TableCell>
                  <TableCell className="text-brand-red font-semibold">฿{movie.basePrice.toFixed(0)}</TableCell>
                  <TableCell>
                    {/* Tailwind Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={movie.isActive} 
                        onChange={() => toggleIsActive(movie)}
                        disabled={updateMutation.isPending}
                      />
                      <div className="w-11 h-6 bg-surface-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red group-hover:after:scale-95 disabled:opacity-50 border border-surface-border"></div>
                      <span className={`ml-3 text-sm font-medium ${movie.isActive ? 'text-brand-red' : 'text-muted-foreground'}`}>
                        {movie.isActive ? 'เปิดฉาย' : 'ปิดฉาย'}
                      </span>
                    </label>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(movie)}
                        className="text-muted-foreground hover:text-white hover:bg-surface-elevated"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setDeleteId(movie.id); setDeleteOpen(true); }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface-elevated border-surface-border text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'แก้ไขภาพยนตร์' : 'เพิ่มภาพยนตร์'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">ชื่อภาพยนตร์</Label>
              <Input
                placeholder="ชื่อภาพยนตร์"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-surface-base border-surface-border text-white placeholder:text-muted-foreground focus-visible:ring-brand-red"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">วันเริ่มฉาย</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="bg-surface-base border-surface-border text-white focus-visible:ring-brand-red"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">วันสิ้นสุด</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="bg-surface-base border-surface-border text-white focus-visible:ring-brand-red"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">ราคาเริ่มต้น (บาท)</Label>
              <Input
                type="number"
                min={0}
                value={form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))}
                className="bg-surface-base border-surface-border text-white focus-visible:ring-brand-red"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={form.isActive} 
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-surface-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red group-hover:after:scale-95 border border-surface-border"></div>
                <span className="ml-3 text-sm font-medium text-muted-foreground">
                  เปิดให้บริการ
                </span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
              className="border-surface-border text-muted-foreground hover:text-white"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-surface-elevated border-surface-border text-white">
          <DialogHeader>
            <DialogTitle className="text-white">ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm py-2">
            คุณแน่ใจหรือไม่ที่จะลบภาพยนตร์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-surface-border text-muted-foreground hover:text-white"
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId, {
                    onSuccess: () => setDeleteOpen(false)
                  });
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
