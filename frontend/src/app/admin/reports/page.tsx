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
import { Loader2, BarChart3, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

import { formatDate } from '@/lib/utils';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);
}

export default function AdminReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [enabled, setEnabled] = useState(true);
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
    <PermissionGuard requiredPermission="reports:read">
      <div className="space-y-6 font-prompt">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
          <div>
            <h1 className="text-2xl font-bold text-white font-prompt">รายงานรายได้ภาพยนตร์ประจำวัน</h1>
            <p className="text-xs text-gray-400">วิเคราะห์ข้อมูลรายได้ การจำหน่ายตั๋ว และสรุปผลตอบแทนตามช่วงเวลา</p>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap gap-4 items-end p-6 rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="report-start-date" className="text-gray-300 flex items-center gap-1.5 text-xs font-prompt">
                <Calendar className="w-3.5 h-3.5 text-brand-red" />วันที่เริ่มต้น:
              </Label>
              <span className="text-[10px] text-brand-red font-mono font-bold bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/20">
                {formatDate(startDate)}
              </span>
            </div>
            <Input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#0A0A0F] border-[#2A2A3E] text-white w-44 text-xs font-mono focus-visible:ring-brand-red"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="report-end-date" className="text-gray-300 flex items-center gap-1.5 text-xs font-prompt">
                <Calendar className="w-3.5 h-3.5 text-brand-red" />วันที่สิ้นสุด:
              </Label>
              <span className="text-[10px] text-brand-red font-mono font-bold bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/20">
                {formatDate(endDate)}
              </span>
            </div>
            <Input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#0A0A0F] border-[#2A2A3E] text-white w-44 text-xs font-mono focus-visible:ring-brand-red"
            />
          </div>

          <Button
            onClick={handleFetch}
            disabled={isLoading}
            className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt shadow-[0_0_12px_rgba(227,24,55,0.25)] px-5 text-xs"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            ประมวลผลรายงาน
          </Button>
        </div>

        {/* Summary Metric Cards */}
        {revenues.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] shadow-lg space-y-2">
              <p className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-brand-red" />รายได้รวมสุทธิ (Total Revenue)
              </p>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-brand-red font-mono">{formatCurrency(totalRevenue)}</p>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] shadow-lg space-y-2">
              <p className="text-xs font-bold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-400" />จำนวนวันที่บันทึก (Operating Days)
              </p>
              <p className="text-3xl font-bold text-white font-mono">{revenues.length} <span className="text-sm font-normal text-gray-400 font-prompt">วัน</span></p>
            </div>
          </div>
        )}

        {/* Visual Bar Chart */}
        {revenues.length > 0 && (
          <div className="p-6 rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-prompt flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-red" />ภาพรวมสถิติรายได้รายวัน (Revenue Trend Visualizer)
              </h2>
              <span className="text-[10px] text-gray-400 font-mono">
                ยอดสูงสุด: <span className="text-brand-red font-bold">{formatCurrency(maxRevenue)}</span>
              </span>
            </div>

            <div className="relative pt-6">
              {/* Baseline Grid */}
              <div className="absolute inset-x-0 bottom-8 border-b border-[#2A2A3E] pointer-events-none" />
              <div className="absolute inset-x-0 top-10 border-b border-[#2A2A3E]/40 border-dashed pointer-events-none" />

              <div className="flex items-end gap-3 h-44 overflow-x-auto pb-8 pt-6 px-2 scrollbar-thin scrollbar-thumb-gray-800">
                {revenues.map((r) => {
                  const pct = Math.min(100, Math.max(12, (r.revenue / maxRevenue) * 100));
                  return (
                    <div key={r.date} className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[42px] group relative">
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#0A0A0F] border border-brand-red/40 text-brand-red text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                        {formatCurrency(r.revenue)}
                      </div>

                      {/* Bar Container */}
                      <div className="w-9 h-32 flex items-end justify-center bg-[#0A0A0F]/60 rounded-t-lg p-0.5 border border-[#2A2A3E]/50">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-brand-red/60 via-brand-red to-red-400 group-hover:brightness-125 transition-all duration-300 shadow-[0_0_12px_rgba(227,24,55,0.4)]"
                          style={{ height: `${pct}%` }}
                        />
                      </div>

                      {/* Date Label */}
                      <span className="text-[10px] text-gray-400 font-mono group-hover:text-white transition-colors">
                        {new Date(r.date).getDate()}/{new Date(r.date).getMonth() + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        {enabled && (
          <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
              </div>
            ) : !revenues.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 text-center">
                <BarChart3 className="w-12 h-12 text-gray-600" />
                <p className="text-white font-medium text-base font-prompt">ไม่พบข้อมูลรายได้ในช่วงวันที่ {formatDate(queryDates.startDate)} ถึง {formatDate(queryDates.endDate)}</p>
                <p className="text-xs max-w-lg text-gray-400 leading-relaxed font-prompt">
                  คำแนะนำ: รายงานรายได้คำนวณจากวันที่ทำรายการจองตั๋ว (Booking Transaction Date) หากเลือกช่วงวันที่ในอนาคตจะยังไม่มีรายการจองเกิดขึ้น กรุณาเลือกช่วงวันที่ที่มีรายการจองเกิดขึ้นจริง
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#0A0A0F]/60 border-b border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableHead className="text-gray-400 font-prompt">วันที่ฉาย/ทำรายการ</TableHead>
                    <TableHead className="text-right text-gray-400 font-prompt">ยอดรายได้สุทธิ</TableHead>
                    <TableHead className="text-right text-gray-400 font-prompt">สัดส่วนรายได้</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((r) => (
                    <TableRow key={r.date} className="border-[#2A2A3E] hover:bg-gray-800/40 transition-colors">
                      <TableCell className="text-white font-medium text-xs font-mono">{formatDate(r.date)}</TableCell>
                      <TableCell className="text-right text-brand-red font-bold font-mono text-sm">
                        {formatCurrency(r.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-28 h-2 rounded-full bg-[#0A0A0F] border border-[#2A2A3E] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-red shadow-[0_0_6px_rgba(227,24,55,0.4)]"
                              style={{ width: `${(r.revenue / maxRevenue) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-300 w-12 text-right">
                            {((r.revenue / totalRevenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-[#0A0A0F] border-t border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableCell className="text-white font-bold font-prompt">รวมรายได้ทั้งหมด ({revenues.length} วัน)</TableCell>
                    <TableCell className="text-right text-brand-red font-bold font-mono text-base">
                      {formatCurrency(totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-gray-400">100.0%</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}

