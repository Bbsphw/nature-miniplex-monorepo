'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { PermissionMatrix } from '@/components/admin/PermissionMatrix';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function AdminPermissionsPage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('roles:manage');

  if (!canManage) {
    return (
      <div className="my-8 p-8 bg-rose-950/20 border border-rose-800/40 rounded-2xl text-center space-y-4 font-prompt max-w-4xl mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-rose-400 font-prompt">
          403 Forbidden — Access Restricted
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไข Role & Permission Matrix (ต้องการสิทธิ์เฉพาะผู้ดูแลระบบหลัก:{' '}
          <code className="text-rose-400 font-mono font-bold">roles:manage</code>)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-prompt">
      {/* Page Title Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
          <div>
            <h1 className="text-2xl font-bold text-white font-prompt">จัดการสิทธิ์บทบาท (Role & Permission Matrix)</h1>
            <p className="text-xs text-gray-400">ตารางกำหนดและบริหารสิทธิ์ระบบ RBAC สำหรับผู้ดูแลระบบหลัก (SYSTEM_ADMIN)</p>
          </div>
        </div>
      </div>

      <PermissionMatrix />
    </div>
  );
}
