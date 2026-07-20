'use client';

import { useState } from 'react';
import apiClient from '@/lib/axios';
import type { Booking } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import axios from 'axios';
import { Search, Loader2, BookOpen, XCircle, Trash2 } from 'lucide-react';

function formatDT(d: string) {
  return new Date(d).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminBookingsPage() {
  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searching, setSearching] = useState(false);

  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string; itemId?: string } | null>(null);
  const [cancelPhone, setCancelPhone] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleSearch = async () => {
    if (!phone) { toast.error('กรุณากรอกเบอร์โทร'); return; }
    setSearching(true);
    try {
      const { data } = await apiClient.get<Booking[]>('/api/bookings', { params: { phoneNumber: phone } });
      setBookings(data);
      setSearchPhone(phone);
      if (!data.length) toast.info('ไม่พบการจองสำหรับเบอร์นี้');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setSearching(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setCancelling(true);
    try {
      if (cancelDialog.itemId) {
        await apiClient.delete(
          `/api/bookings/${cancelDialog.bookingId}/items/${cancelDialog.itemId}`,
          { params: { phoneNumber: cancelPhone } }
        );
        toast.success('ยกเลิกรายการสำเร็จ');
      } else {
        await apiClient.delete(`/api/bookings/${cancelDialog.bookingId}`, {
          params: { phoneNumber: cancelPhone },
        });
        toast.success('ยกเลิกการจองสำเร็จ');
      }
      setCancelDialog(null);
      setCancelPhone('');
      if (searchPhone) {
        const { data } = await apiClient.get<Booking[]>('/api/bookings', { params: { phoneNumber: searchPhone } });
        setBookings(data);
      }
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? (error.response?.data?.message ?? 'ไม่สามารถยกเลิกได้') : 'เกิดข้อผิดพลาด');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-brand-red" />
        <h1 className="text-2xl font-bold text-white font-prompt">จัดการการจอง</h1>
      </div>

      <div className="flex gap-3 max-w-md">
        <Input
          type="tel"
          placeholder="กรอกเบอร์โทรศัพท์..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-surface-elevated border-surface-border text-white placeholder:text-muted-foreground focus-visible:ring-brand-red"
          maxLength={10}
        />
        <Button onClick={handleSearch} disabled={searching}
          className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {bookings.length > 0 && (
        <div className="rounded-2xl border border-surface-border bg-surface-DEFAULT overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-surface-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Booking ID</TableHead>
                <TableHead className="text-muted-foreground">เบอร์</TableHead>
                <TableHead className="text-muted-foreground">เวลาจอง</TableHead>
                <TableHead className="text-muted-foreground">สถานะ</TableHead>
                <TableHead className="text-muted-foreground">ที่นั่ง</TableHead>
                <TableHead className="text-right text-muted-foreground">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id} className="border-surface-border hover:bg-surface-elevated">
                  <TableCell className="text-white font-mono text-xs">{b.id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-muted-foreground">{b.customer?.phoneNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDT(b.bookingTime)}</TableCell>
                  <TableCell>
                    <Badge className={b.status === 'Completed'
                      ? 'bg-brand-red/20 text-brand-red border-brand-red/30'
                      : 'bg-destructive/20 text-destructive border-destructive/30'}>
                      {b.status === 'Completed' ? 'Completed' : 'Canceled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {b.bookingItems?.map((item) => (
                        <div key={item.id} className="flex items-center gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            item.itemStatus === 'Active'
                              ? 'bg-brand-red text-white'
                              : 'bg-surface-elevated text-muted-foreground line-through'
                          }`}>
                            {item.seat?.rowName}{item.seat?.columnName}
                          </span>
                          {item.itemStatus === 'Active' && (
                            <button
                              onClick={() => setCancelDialog({ open: true, bookingId: b.id, itemId: item.id })}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="ยกเลิกรายการนี้"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === 'Completed' && (
                      <Button size="sm" variant="ghost"
                        onClick={() => setCancelDialog({ open: true, bookingId: b.id })}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {searchPhone && !bookings.length && !searching && (
        <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
          <BookOpen className="w-12 h-12" />
          <p>ไม่พบการจองสำหรับเบอร์ {searchPhone}</p>
        </div>
      )}

      <Dialog open={cancelDialog?.open ?? false} onOpenChange={(o) => !o && setCancelDialog(null)}>
        <DialogContent className="bg-surface-elevated border-surface-border text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {cancelDialog?.itemId ? 'ยกเลิกรายการที่นั่ง' : 'ยกเลิกการจอง'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-muted-foreground">เบอร์โทรยืนยัน</Label>
            <Input type="tel" placeholder="0891234567" value={cancelPhone}
              onChange={(e) => setCancelPhone(e.target.value)}
              className="bg-surface-base border-surface-border text-white placeholder:text-muted-foreground"
              maxLength={10} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)} disabled={cancelling}
              className="border-surface-border text-muted-foreground hover:text-white">ยกเลิก</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90">
              {cancelling && <Loader2 className="w-4 h-4 animate-spin mr-2" />}ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
