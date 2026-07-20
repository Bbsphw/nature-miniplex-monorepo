'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { DailyRevenue } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, BarChart3, TrendingUp, Calendar } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);
}

export default function AdminReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [enabled, setEnabled] = useState(false);
  const [queryDates, setQueryDates] = useState({ startDate: firstOfMonth, endDate: today });

  const { data: revenues = [], isLoading } = useQuery<DailyRevenue[]>({
    queryKey: ['daily-revenue', queryDates],
    queryFn: async () => {
      const { data } = await apiClient.get<DailyRevenue[]>('/api/reports/daily-revenue', {
        params: queryDates,
      });
      return data;
    },
    enabled,
  });

  const handleFetch = () => {
    setQueryDates({ startDate, endDate });
    setEnabled(true);
  };

  const totalRevenue = revenues.reduce((sum, r) => sum + r.revenue, 0);
  const maxRevenue = Math.max(...revenues.map((r) => r.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-brand-red" />
        <h1 className="text-2xl font-bold text-white font-prompt">รายงานรายได้รายวัน</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-end p-6 rounded-2xl border border-surface-border bg-surface-DEFAULT">
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />วันที่เริ่ม
          </Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="bg-surface-elevated border-surface-border text-white w-40" />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />วันที่สิ้นสุด
          </Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="bg-surface-elevated border-surface-border text-white w-40" />
        </div>
        <Button onClick={handleFetch} disabled={isLoading}
          className="bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
          ดึงรายงาน
        </Button>
      </div>

      {revenues.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-surface-border bg-surface-DEFAULT space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-red" />รายได้รวม
            </p>
            <p className="text-3xl font-bold text-brand-red">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-6 rounded-2xl border border-surface-border bg-surface-DEFAULT space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-red" />จำนวนวัน
            </p>
            <p className="text-3xl font-bold text-white">{revenues.length} วัน</p>
          </div>
        </div>
      )}

      {revenues.length > 0 && (
        <div className="p-6 rounded-2xl border border-surface-border bg-surface-DEFAULT">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">ภาพรวมรายได้</h2>
          <div className="flex items-end gap-2 h-32 overflow-x-auto pb-2">
            {revenues.map((r) => {
              const pct = (r.revenue / maxRevenue) * 100;
              return (
                <div key={r.date} className="flex flex-col items-center gap-1 flex-shrink-0 min-w-8 group">
                  <div
                    className="w-8 rounded-t-sm bg-brand-red/60 group-hover:bg-brand-red transition-colors duration-200"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${formatDate(r.date)}: ${formatCurrency(r.revenue)}`}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(r.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {enabled && (
        <div className="rounded-2xl border border-surface-border bg-surface-DEFAULT overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
            </div>
          ) : !revenues.length ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
              <BarChart3 className="w-12 h-12" />
              <p>ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-surface-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">วันที่</TableHead>
                  <TableHead className="text-right text-muted-foreground">รายได้</TableHead>
                  <TableHead className="text-right text-muted-foreground">สัดส่วน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((r) => (
                  <TableRow key={r.date} className="border-surface-border hover:bg-surface-elevated">
                    <TableCell className="text-white">{formatDate(r.date)}</TableCell>
                    <TableCell className="text-right text-brand-red font-semibold">
                      {formatCurrency(r.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-2 rounded-full bg-surface-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-red"
                            style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {((r.revenue / totalRevenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="border-surface-border bg-surface-elevated">
                  <TableCell className="text-white font-bold">รวมทั้งหมด</TableCell>
                  <TableCell className="text-right text-brand-red font-bold">
                    {formatCurrency(totalRevenue)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
