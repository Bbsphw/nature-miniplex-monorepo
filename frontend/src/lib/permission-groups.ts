import type { Permission } from '@/types/api';
import {
  Ticket,
  Film,
  Clock,
  Users,
  Shield,
  BarChart3,
  Building2,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface PermissionModuleGroup {
  id: string;
  label: string;
  labelTh: string;
  description: string;
  icon: LucideIcon;
  match: (permission: Permission) => boolean;
}

/** Functional domains aligned with Nature MiniPlex SRS */
export const PERMISSION_MODULES: PermissionModuleGroup[] = [
  {
    id: 'bookings',
    label: 'Ticketing Operations',
    labelTh: 'การจองตั๋ว',
    description: 'อ่าน / จอง / ยกเลิกตั๋วตามขอบเขตสิทธิ์',
    icon: Ticket,
    match: (p) =>
      p.resource?.toLowerCase().includes('booking') ||
      p.code.toLowerCase().startsWith('bookings:'),
  },
  {
    id: 'movies',
    label: 'Movie Management',
    labelTh: 'จัดการภาพยนตร์',
    description: 'เพิ่ม แก้ไข เปิด/ปิดรายการภาพยนตร์',
    icon: Film,
    match: (p) =>
      p.resource?.toLowerCase().includes('movie') ||
      p.code.toLowerCase().startsWith('movie'),
  },
  {
    id: 'showtimes',
    label: 'Schedule & Screening',
    labelTh: 'รอบฉาย & ล็อครอบ',
    description: 'จัดตารางรอบฉาย และยืนยันเริ่มฉาย (ล็อคการจอง)',
    icon: Clock,
    match: (p) =>
      p.resource?.toLowerCase().includes('showtime') ||
      p.code.toLowerCase().startsWith('showtime') ||
      p.code.toLowerCase().includes('screening') ||
      p.code.toLowerCase().includes('lock'),
  },
  {
    id: 'cinemas',
    label: 'Cinema & Infrastructure',
    labelTh: 'สาขา & ที่นั่ง',
    description: 'ตั้งค่าสาขาโรงหนังและผังที่นั่ง',
    icon: Building2,
    match: (p) =>
      p.resource?.toLowerCase().includes('cinema') ||
      p.code.toLowerCase().startsWith('cinema') ||
      p.code.toLowerCase().includes('seat'),
  },
  {
    id: 'users',
    label: 'User Management',
    labelTh: 'จัดการผู้ใช้',
    description: 'สร้าง/แก้ไขบัญชีพนักงานและขอบเขตสาขา',
    icon: Users,
    match: (p) =>
      p.resource?.toLowerCase().includes('user') ||
      p.code.toLowerCase().startsWith('users:'),
  },
  {
    id: 'roles',
    label: 'Roles & Security',
    labelTh: 'บทบาท & ความปลอดภัย',
    description: 'กำหนดสิทธิ์ Role และนโยบายความปลอดภัย',
    icon: Shield,
    match: (p) =>
      p.resource?.toLowerCase().includes('role') ||
      p.code.toLowerCase().startsWith('roles:') ||
      p.code.toLowerCase().includes('permission'),
  },
  {
    id: 'reports',
    label: 'Reporting & Analytics',
    labelTh: 'รายงาน & วิเคราะห์',
    description: 'ดูรายงานรายได้และสถิติแบบเรียลไทม์',
    icon: BarChart3,
    match: (p) =>
      p.resource?.toLowerCase().includes('report') ||
      p.code.toLowerCase().startsWith('report') ||
      p.code.toLowerCase().includes('analytics') ||
      p.code.toLowerCase().includes('export'),
  },
  {
    id: 'system',
    label: 'System Settings',
    labelTh: 'ตั้งค่าระบบ',
    description: 'การตั้งค่าทั่วไปและสิทธิ์อื่น ๆ',
    icon: Settings,
    match: () => true,
  },
];

const SENSITIVE_PATTERNS = [
  /delete/i,
  /export/i,
  /manage/i,
  /api.?key/i,
  /roles:manage/i,
  /users:manage/i,
  /cancel:any/i,
  /override/i,
  /admin/i,
];

export function isSensitivePermission(permission: Permission): boolean {
  const haystack = `${permission.code} ${permission.action} ${permission.resource} ${permission.description ?? ''}`;
  return SENSITIVE_PATTERNS.some((re) => re.test(haystack));
}

export function groupPermissionsByModule(
  permissions: Permission[]
): { group: PermissionModuleGroup; permissions: Permission[] }[] {
  const remaining = [...permissions];
  const result: { group: PermissionModuleGroup; permissions: Permission[] }[] = [];

  for (const group of PERMISSION_MODULES) {
    if (group.id === 'system') continue;

    const matched = remaining.filter((p) => group.match(p));
    if (matched.length === 0) continue;

    matched.forEach((p) => {
      const idx = remaining.indexOf(p);
      if (idx >= 0) remaining.splice(idx, 1);
    });

    result.push({ group, permissions: matched });
  }

  const systemGroup = PERMISSION_MODULES.find((g) => g.id === 'system')!;
  if (remaining.length > 0) {
    result.push({ group: systemGroup, permissions: remaining });
  }

  return result;
}

export function filterPermissions(
  permissions: Permission[],
  query: string
): Permission[] {
  const q = query.trim().toLowerCase();
  if (!q) return permissions;
  return permissions.filter((p) => {
    const blob = `${p.code} ${p.action} ${p.resource} ${p.description ?? ''}`.toLowerCase();
    return blob.includes(q);
  });
}
