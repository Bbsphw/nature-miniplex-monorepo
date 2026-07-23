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
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Plus, Pencil, Trash2, Loader2, Film, CheckCircle2, AlertTriangle, Calendar, DollarSign } from 'lucide-react';

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
    <PermissionGuard requiredPermissions={['movies:read', 'movies:manage', 'movies:create', 'movies:update', 'movies:delete', 'showtime:create']} requireAll={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
            <div>
              <h1 className="text-2xl font-bold text-white font-prompt">จัดการภาพยนตร์</h1>
              <p className="text-xs text-gray-400">บริหารจัดการแคตตาล็อกภาพยนตร์ กำหนดวันฉาย และราคาตั๋วเริ่มต้น</p>
            </div>
          </div>
          <PermissionGuard requiredPermission="movies:create">
            <Button
              onClick={openAdd}
              className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt shadow-[0_0_14px_rgba(227,24,55,0.3)] transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มภาพยนตร์ใหม่
            </Button>
          </PermissionGuard>
        </div>

        <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl min-h-[480px] flex flex-col justify-between">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
            </div>
          ) : !movies.length ? (
            <div className="flex flex-col items-center py-24 text-gray-400 gap-3">
              <Film className="w-12 h-12 text-gray-600" />
              <p className="font-prompt">ยังไม่มีรายการภาพยนตร์ในระบบ</p>
            </div>
          ) : (
            <div className="flex-1">
              <Table>
                <TableHeader className="bg-[#0A0A0F]/60 border-b border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-prompt">ชื่อภาพยนตร์</TableHead>
                    <TableHead className="text-gray-400 font-prompt">วันเริ่มฉาย</TableHead>
                    <TableHead className="text-gray-400 font-prompt">วันสิ้นสุด</TableHead>
                    <TableHead className="text-gray-400 font-prompt">ราคาเริ่มต้น</TableHead>
                    <TableHead className="text-gray-400 font-prompt">สถานะฉาย</TableHead>
                    <PermissionGuard requiredPermissions={['movies:update', 'movies:delete']} requireAll={false}>
                      <TableHead className="text-right text-gray-400 font-prompt">การจัดการ</TableHead>
                    </PermissionGuard>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovies.map((movie) => (
                    <TableRow key={movie.id} className="border-[#2A2A3E] hover:bg-gray-800/40 transition-colors">
                      <TableCell className="text-white font-bold font-prompt">{movie.title}</TableCell>
                      <TableCell className="text-gray-400 text-xs font-mono">{formatDate(movie.startDate)}</TableCell>
                      <TableCell className="text-gray-400 text-xs font-mono">{formatDate(movie.endDate)}</TableCell>
                      <TableCell className="text-brand-red font-bold font-mono">฿{movie.basePrice.toFixed(0)}</TableCell>
                      <TableCell>
                        {/* Premium Cinema Status Toggle Card Button with PermissionGuard */}
                        <PermissionGuard requiredPermission="movies:update" mode="disable">
                          <button
                            type="button"
                            aria-pressed={movie.isActive}
                            onClick={() => handleToggleActiveClick(movie)}
                            disabled={updateMutation.isPending}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-prompt transition-all ${
                              movie.isActive
                                ? 'bg-brand-red/15 border-brand-red text-brand-red shadow-[0_0_10px_rgba(227,24,55,0.2)]'
                                : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {movie.isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-red" />
                                <span>เปิดฉายปกติ</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />
                                <span>ปิดฉายชั่วคราว</span>
                              </>
                            )}
                          </button>
                        </PermissionGuard>
                      </TableCell>
                      <PermissionGuard requiredPermissions={['movies:update', 'movies:delete']} requireAll={false}>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <PermissionGuard requiredPermission="movies:update">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(movie)}
                                className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs"
                                title="แก้ไขข้อมูลภาพยนตร์"
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                <span>แก้ไข</span>
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermission="movies:delete">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(movie)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs"
                                title="ลบภาพยนตร์"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                <span>ลบ</span>
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </PermissionGuard>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Shadcn UI Pagination with smooth event handlers */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#2A2A3E] bg-[#0A0A0F]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-gray-400">
                แสดงภาพยนตร์ {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, movies.length)} จากทั้งหมด {movies.length} เรื่อง
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

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#1C1C27] border-[#2A2A3E] text-white sm:max-w-lg rounded-2xl shadow-2xl">
            <DialogHeader className="border-b border-[#2A2A3E] pb-3">
              <DialogTitle className="text-white font-prompt flex items-center gap-2 text-lg">
                <Film className="w-5 h-5 text-brand-red" />
                <span>{editing ? 'แก้ไขข้อมูลภาพยนตร์' : 'เพิ่มภาพยนตร์ใหม่'}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-prompt">ชื่อภาพยนตร์ (Title):</Label>
                <Input
                  placeholder="เช่น Avatar: The Way of Water"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="bg-[#0A0A0F] border-[#2A2A3E] text-white placeholder:text-gray-600 focus-visible:ring-brand-red text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-300 font-prompt flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-red" />
                      วันเริ่มฉาย:
                    </Label>
                    {form.startDate && (
                      <span className="text-[10px] font-bold text-brand-red font-mono bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/20">
                        {formatDate(form.startDate)}
                      </span>
                    )}
                  </div>
                  <Input
                    type="date"
                    max={form.endDate || undefined}
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="bg-[#0A0A0F] border-[#2A2A3E] text-white focus-visible:ring-brand-red text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-300 font-prompt flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-red" />
                      วันสิ้นสุด:
                    </Label>
                    {form.endDate && (
                      <span className="text-[10px] font-bold text-brand-red font-mono bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/20">
                        {formatDate(form.endDate)}
                      </span>
                    )}
                  </div>
                  <Input
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="bg-[#0A0A0F] border-[#2A2A3E] text-white focus-visible:ring-brand-red text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300 font-prompt flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  ราคาตั๋วเริ่มต้น (บาท):
                </Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="100"
                  value={form.basePrice === 0 ? '' : form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  className="bg-[#0A0A0F] border-[#2A2A3E] text-white focus-visible:ring-brand-red text-xs font-mono"
                />
              </div>

              {/* Status Selection: Premium Segmented Toggle Pills (No Checkbox) */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-gray-300 font-prompt">สถานะเปิดให้บริการฉาย:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-selected={form.isActive === true}
                    onClick={() => setForm((f) => ({ ...f, isActive: true }))}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-bold font-prompt ${
                      form.isActive === true
                        ? 'bg-brand-red/20 border-brand-red text-brand-red shadow-[0_0_12px_rgba(227,24,55,0.25)]'
                        : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${form.isActive === true ? 'text-brand-red' : 'text-gray-600'}`} />
                    <span>เปิดฉายภาพยนตร์</span>
                  </button>

                  <button
                    type="button"
                    aria-selected={form.isActive === false}
                    onClick={() => setForm((f) => ({ ...f, isActive: false }))}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-bold font-prompt ${
                      form.isActive === false
                        ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                        : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-500 hover:border-gray-700'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${form.isActive === false ? 'text-red-400' : 'text-gray-600'}`} />
                    <span>ปิดฉายชั่วคราว</span>
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
                className="border-[#2A2A3E] bg-[#0A0A0F] text-gray-300 hover:bg-gray-800 text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs px-5 shadow-[0_0_12px_rgba(227,24,55,0.3)]"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editing ? 'บันทึกการแก้ไข' : 'บันทึกภาพยนตร์ใหม่'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}

