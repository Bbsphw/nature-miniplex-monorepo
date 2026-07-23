import { Film, Clock, Ticket, BarChart3, Users, Settings, ShieldCheck, LucideIcon } from 'lucide-react';

export interface NavItemConfig {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /**
   * Required permissions array (OR logic)
   * Example: ['movies:read'] or ['users:manage', 'roles:manage']
   */
  permissions?: string[];
}

export interface NavGroupConfig {
  category: string;
  items: NavItemConfig[];
}

export const navConfig: NavGroupConfig[] = [
  {
    category: 'การดำเนินงานโรงภาพยนตร์',
    items: [
      {
        href: '/admin/movies',
        label: 'จัดการภาพยนตร์',
        description: 'แคตตาล็อกหนังและเรทภาพยนตร์',
        icon: Film,
        permissions: ['movies:read', 'movies:manage'],
      },
      {
        href: '/admin/showtimes',
        label: 'ตารางรอบฉาย',
        description: 'จัดรอบฉายและผูกโรงภาพยนตร์',
        icon: Clock,
        permissions: ['showtimes:read', 'showtimes:manage'],
      },
      {
        href: '/admin/bookings',
        label: 'รายการจองตั๋วภาพยนตร์',
        description: 'ดูรายการจองและจำหน่ายตั๋ว',
        icon: Ticket,
        permissions: ['bookings:read:assigned_cinema', 'bookings:read:all'],
      },
    ],
  },
  {
    category: 'รายงานและการวิเคราะห์',
    items: [
      {
        href: '/admin/reports',
        label: 'รายงานและสถิติยอดขาย',
        description: 'รายงานสรุปรายได้ภาพยนตร์',
        icon: BarChart3,
        permissions: ['reports:read'],
      },
    ],
  },
  {
    category: 'การตั้งค่าและสิทธิ์ระบบ',
    items: [
      {
        href: '/admin/users',
        label: 'จัดการผู้ใช้และพนักงาน',
        description: 'บัญชีพนักงานและ Cinema Scope RLS',
        icon: Users,
        permissions: ['users:manage'],
      },
      {
        href: '/admin/permissions',
        label: 'จัดการสิทธิ์บทบาท',
        description: 'กำหนดตารางสิทธิ์การใช้งานระบบ RBAC',
        icon: ShieldCheck,
        permissions: ['roles:manage'],
      },
      {
        href: '/admin/settings',
        label: 'ตั้งค่าส่วนตัว & ความปลอดภัย',
        description: 'โปรไฟล์ส่วนตัว รหัสผ่าน และการรักษาความปลอดภัย',
        icon: Settings,
        permissions: [],
      },
    ],
  },
];
