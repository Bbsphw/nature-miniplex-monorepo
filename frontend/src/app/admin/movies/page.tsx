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
import { toast } from '@/store/useToastStore';
import { confirmModal } from '@/store/useConfirmStore';
import { Plus, Pencil, Trash2, Loader2, Film } from 'lucide-react';

import { formatDate } from '@/lib/utils';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const emptyForm: CreateMovieCommand = {
  title: '',
  startDate: '',
  endDate: '',
  basePrice: 100,
  isActive: true,
};

export default function AdminMoviesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Movie | null>(null);
  const [form, setForm] = useState<CreateMovieCommand>(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: movies = [], isLoading } = useMovies(false); // Fetch ALL movies (including inactive)
  const totalPages = Math.ceil(movies.length / pageSize) || 1;
  const paginatedMovies = movies.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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

  // 1. Centered Pop-up Confirmation Modal for Status Toggle (No Toast on Cancel)
  const handleToggleActiveClick = (movie: Movie) => {
    const targetStatus = !movie.isActive;
    const statusText = targetStatus ? 'เปิดฉาย' : 'ปิดฉาย';

    confirmModal({
      title: `ยืนยันการเปลี่ยนสถานะเป็น "${statusText}"`,
      description: `คุณต้องการเปลี่ยนสถานะภาพยนตร์เรื่อง "${movie.title}" เป็น ${statusText} ใช่หรือไม่?`,
      confirmText: 'ยืนยัน',
      cancelText: 'ยกเลิก',
      variant: 'primary',
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          updateMutation.mutate(
            {
              id: movie.id,
              title: movie.title,
              startDate: movie.startDate.slice(0, 10),
              endDate: movie.endDate.slice(0, 10),
              basePrice: movie.basePrice,
              isActive: targetStatus,
            },
            {
              onSuccess: () => {
                // Toast notification ONLY when action is confirmed
                toast.success(`เปลี่ยนสถานะ "${movie.title}" เป็น ${statusText} เรียบร้อยแล้ว`);
                resolve();
              },
              onError: (err) => {
                reject(err);
              },
            }
          );
        });
      },
    });
  };

  // 2. Centered Pop-up Confirmation Modal for Movie Deletion (No Toast on Cancel)
  const handleDeleteClick = (movie: Movie) => {
    confirmModal({
      title: `ยืนยันการลบภาพยนตร์`,
      description: `คุณแน่ใจหรือไม่ที่จะลบภาพยนตร์ "${movie.title}"? การดำเนินการนี้จะนำข้อมูลออกจากระบบ`,
      confirmText: 'ลบภาพยนตร์',
      cancelText: 'ยกเลิก',
      variant: 'destructive',
      onConfirm: async () => {
        return new Promise<void>((resolve, reject) => {
          deleteMutation.mutate(movie.id, {
            onSuccess: () => {
              // Toast notification ONLY when deletion is confirmed
              toast.success(`ลบภาพยนตร์ "${movie.title}" เรียบร้อยแล้ว`);
              resolve();
            },
            onError: (err) => {
              reject(err);
            },
          });
        });
      },
    });
  };

  const handleSubmit = () => {
    if (!form.title || !form.startDate || !form.endDate || form.basePrice <= 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (form.startDate > form.endDate) {
      toast.error('วันเริ่มฉายต้องไม่อยู่หลังวันสิ้นสุดการฉาย');
      return;
    }

    if (editing) {
      updateMutation.mutate(
        { ...form, id: editing.id },
        {
          onSuccess: () => {
            setDialogOpen(false);
            toast.success(`แก้ไขข้อมูลภาพยนตร์ "${form.title}" สำเร็จ`);
          },
        }
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success(`เพิ่มภาพยนตร์ "${form.title}" สำเร็จ`);
        },
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
              {paginatedMovies.map((movie) => (
                <TableRow key={movie.id} className="border-surface-border hover:bg-surface-elevated">
                  <TableCell className="text-white font-medium">{movie.title}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(movie.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(movie.endDate)}</TableCell>
                  <TableCell className="text-brand-red font-semibold">฿{movie.basePrice.toFixed(0)}</TableCell>
                  <TableCell>
                    {/* Status Toggle Switch triggering Centered Confirm Modal */}
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={movie.isActive}
                        onChange={() => handleToggleActiveClick(movie)}
                        disabled={updateMutation.isPending}
                      />
                      <div className="w-11 h-6 bg-surface-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red group-hover:after:scale-95 disabled:opacity-50 border border-surface-border"></div>
                      <span className={`ml-3 text-sm font-medium transition-colors ${movie.isActive ? 'text-brand-red' : 'text-muted-foreground'}`}>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Shadcn UI Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-surface-border bg-surface-DEFAULT flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">
              แสดงภาพยนตร์ {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, movies.length)} จากทั้งหมด {movies.length} เรื่อง
            </span>
            <Pagination className="w-auto mx-0">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
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
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">วันเริ่มฉาย</Label>
                  {form.startDate && (
                    <span className="text-xs font-bold text-brand-red font-mono bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                      {formatDate(form.startDate)}
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  max={form.endDate || undefined}
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="bg-surface-base border-surface-border text-white focus-visible:ring-brand-red"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">วันสิ้นสุด</Label>
                  {form.endDate && (
                    <span className="text-xs font-bold text-brand-red font-mono bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/20">
                      {formatDate(form.endDate)}
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  min={form.startDate || undefined}
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
                placeholder="กรอกราคาเริ่มต้น"
                value={form.basePrice === 0 ? '' : form.basePrice}
                onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value === '' ? 0 : Number(e.target.value) }))}
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
    </div>
  );
}
