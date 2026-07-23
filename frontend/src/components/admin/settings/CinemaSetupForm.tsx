'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/store/useToastStore';
import { SettingsFormSkeleton } from './SettingsFormSkeleton';
import { Film, Save, RotateCcw, DollarSign } from 'lucide-react';

const cinemaSetupSchema = z.object({
  standardTicketPrice: z.number().min(50, { message: 'ตั๋วราคาขั้นต่ำ 50 บาท' }),
  vipTicketPrice: z.number().min(100, { message: 'ตั๋ว VIP ราคาขั้นต่ำ 100 บาท' }),
  sofaBedTicketPrice: z.number().min(200, { message: 'ตั๋ว Sofa Bed ราคาขั้นต่ำ 200 บาท' }),
  taxRatePercent: z.number().min(0).max(30),
});

type CinemaSetupFormValues = z.infer<typeof cinemaSetupSchema>;

const DEFAULT_SETUP: CinemaSetupFormValues = {
  standardTicketPrice: 160,
  vipTicketPrice: 240,
  sofaBedTicketPrice: 500,
  taxRatePercent: 7,
};

export function CinemaSetupForm() {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CinemaSetupFormValues>({
    resolver: zodResolver(cinemaSetupSchema),
    defaultValues: DEFAULT_SETUP,
  });

  const onSubmit = async (data: CinemaSetupFormValues) => {
    setIsSaving(true);
    try {
      toast.success('บันทึกราคาและโครงสร้างโรงภาพยนตร์สำเร็จ');
      reset(data);
    } catch {
      toast.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-[#1C1C27] border-[#2A2A3E] text-white rounded-2xl shadow-xl p-2 transition-all">
      <CardHeader className="border-b border-[#2A2A3E]/60 pb-4">
        <CardTitle className="text-lg font-bold font-prompt flex items-center gap-2.5 text-white">
          <Film className="w-5 h-5 text-[#E31837]" />
          ตั้งค่าราคาและโรงภาพยนตร์ (Cinema Setup & Default Pricing)
        </CardTitle>
        <CardDescription className="text-gray-400 text-xs font-prompt mt-1">
          กำหนดราคาตั๋วเริ่มต้นตามประเภทที่นั่ง (Standard, VIP, Sofa Bed) และภาษีมูลค่าเพิ่ม
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="standardTicketPrice" className="text-xs font-medium text-gray-300 font-prompt">
                ราคาตั๋ว Standard (THB) <span className="text-[#E31837]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="standardTicketPrice"
                  type="number"
                  {...register('standardTicketPrice', { valueAsNumber: true })}
                  className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs font-prompt focus-visible:ring-[#E31837] pl-8"
                />
                <DollarSign className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
              </div>
              {errors.standardTicketPrice && (
                <p className="text-[11px] text-red-400 font-prompt">{errors.standardTicketPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vipTicketPrice" className="text-xs font-medium text-gray-300 font-prompt">
                ราคาตั๋ว VIP (THB) <span className="text-[#E31837]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="vipTicketPrice"
                  type="number"
                  {...register('vipTicketPrice', { valueAsNumber: true })}
                  className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs font-prompt focus-visible:ring-[#E31837] pl-8"
                />
                <DollarSign className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
              </div>
              {errors.vipTicketPrice && (
                <p className="text-[11px] text-red-400 font-prompt">{errors.vipTicketPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sofaBedTicketPrice" className="text-xs font-medium text-gray-300 font-prompt">
                ราคาตั๋ว Sofa Bed (THB/คู่) <span className="text-[#E31837]">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="sofaBedTicketPrice"
                  type="number"
                  {...register('sofaBedTicketPrice', { valueAsNumber: true })}
                  className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs font-prompt focus-visible:ring-[#E31837] pl-8"
                />
                <DollarSign className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-3" />
              </div>
              {errors.sofaBedTicketPrice && (
                <p className="text-[11px] text-red-400 font-prompt">{errors.sofaBedTicketPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRatePercent" className="text-xs font-medium text-gray-300 font-prompt">
                อัตราภาษีมูลค่าเพิ่ม (%) <span className="text-[#E31837]">*</span>
              </Label>
              <Input
                id="taxRatePercent"
                type="number"
                {...register('taxRatePercent', { valueAsNumber: true })}
                className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs font-prompt focus-visible:ring-[#E31837]"
              />
              {errors.taxRatePercent && (
                <p className="text-[11px] text-red-400 font-prompt">{errors.taxRatePercent.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2A2A3E]">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset(DEFAULT_SETUP)}
              className="w-full sm:w-auto border-[#2A2A3E] bg-[#0A0A0F] hover:bg-[#2A2A3E] text-gray-300 text-xs font-prompt rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2 text-gray-400" />
              คืนค่ามาตรฐาน
            </Button>

            <Button
              type="submit"
              disabled={!isDirty || isSaving}
              className={`w-full sm:w-auto font-bold font-prompt text-xs px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                isDirty
                  ? 'bg-[#E31837] hover:bg-[#E31837]/90 text-white shadow-[0_0_15px_rgba(227,24,55,0.4)] cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              บันทึกการเปลี่ยนแปลง (Save Changes)
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
