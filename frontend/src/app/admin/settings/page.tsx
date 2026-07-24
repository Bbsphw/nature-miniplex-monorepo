'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import {
  User,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/types/api';

export default function AccountSettingsPage() {
  const { username, role, permissions, setPermissions } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [profile, setProfile] = useState<UserProfile>({
    id: 1,
    username: username || 'User',
    email: 'user@natureminiplex.com',
    phoneNumber: '0812345678',
    role: role || 'CINEMA_MANAGER',
    permissions: permissions || [],
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await apiClient.get<UserProfile>('/api/users/profile').catch(() => null);
      if (res?.data) {
        setProfile(res.data);
        if (res.data.permissions && res.data.permissions.length > 0) {
          setPermissions(res.data.permissions);
        }
      } else {
        setProfile((prev) => ({
          ...prev,
          username: username || 'User',
          role: role || 'CINEMA_MANAGER',
          permissions: permissions || [],
        }));
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [username, role, permissions, setPermissions]);

  useEffect(() => {
    let ignore = false;
    apiClient.get<UserProfile>('/api/users/profile')
      .then((res) => {
        if (ignore) return;
        if (res?.data) {
          setProfile(res.data);
          if (res.data.permissions && res.data.permissions.length > 0) {
            setPermissions(res.data.permissions);
          }
        }
      })
      .catch(() => {
        if (ignore) return;
        setProfile((prev) => ({
          ...prev,
          username: username || 'User',
          role: role || 'CINEMA_MANAGER',
          permissions: permissions || [],
        }));
      })
      .finally(() => {
        if (!ignore) {
          setLoadingProfile(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [username, role, permissions, setPermissions]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiClient.put('/api/users/profile', {
        email: profile.email,
      });
      toast.success('โปรไฟล์ได้รับการอัปเดตเรียบร้อยแล้ว');
    } catch {
      toast.error('ไม่สามารถอัปเดตโปรไฟล์ได้ กรุณาลองอีกครั้ง');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.post('/api/users/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg =
        axiosErr.response?.data?.detail ||
        axiosErr.response?.data?.message ||
        'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 font-prompt">
      {/* Page Title Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
          <div>
            <h1 className="text-2xl font-bold text-white font-prompt">ตั้งค่าส่วนตัว & ความปลอดภัย (Account Settings)</h1>
            <p className="text-xs text-gray-400">จัดการข้อมูลโปรไฟล์บัญชี รหัสผ่าน และการตั้งค่าส่วนบุคคล</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUserProfile}
            disabled={loadingProfile}
            className="border-[#2A2A3E] bg-[#1C1C27] hover:bg-[#2A2A3E] text-gray-300 text-xs font-prompt"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingProfile ? 'animate-spin' : ''}`} />
            รีเฟรชข้อมูล
          </Button>
        </div>
      </div>

      {/* Tab Navigation Segmented Pills */}
      <div className="flex border-b border-[#2A2A3E] gap-2">
        {(
          [
            { id: 'profile' as const, icon: User, label: 'ข้อมูลส่วนตัว (Profile)' },
            { id: 'security' as const, icon: KeyRound, label: 'ความปลอดภัย (Security)' },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-prompt border-b-2 transition-all whitespace-nowrap ${
                active
                  ? 'border-brand-red text-white bg-[#1C1C27]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 text-brand-red" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Profile Management */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl p-6 space-y-4">
          <div className="pb-2 border-b border-[#2A2A3E]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-prompt">
              <User className="w-4 h-4 text-brand-red" />
              จัดการข้อมูลส่วนตัว (Manage Account Profile)
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              แก้ไขข้อมูลชื่อบัญชี อีเมลประจำตัวพนักงานระบบ
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-gray-300 font-prompt">
                ชื่อผู้ใช้งาน (Username):
              </Label>
              <Input
                id="username"
                value={profile.username}
                disabled
                className="bg-[#0A0A0F] border-[#2A2A3E] text-gray-400 text-xs cursor-not-allowed font-mono"
              />
              <p className="text-[11px] text-gray-500 font-prompt">
                * Username ไม่สามารถเปลี่ยนได้หลังลงทะเบียน
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-badge" className="text-xs text-gray-300 font-prompt block">
                บทบาทปัจจุบันในระบบ (Assigned Role):
              </Label>
              <div className="flex items-center gap-2">
                <Badge className="bg-brand-red/20 border-brand-red/40 text-brand-red text-xs px-3 py-1 font-mono">
                  {role}
                </Badge>
                <span className="text-xs text-gray-400 font-prompt">
                  ({role === 'SYSTEM_ADMIN' ? 'ผู้ดูแลระบบหลัก' : role === 'CINEMA_MANAGER' ? 'ผู้จัดการสาขา' : 'พนักงานเคาน์เตอร์'})
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-gray-300 font-prompt">
                อีเมล (Email):
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs focus-visible:ring-brand-red font-prompt"
                placeholder="staff@natureminiplex.com"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={savingProfile}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt text-xs px-6 py-2 rounded-xl shadow-[0_0_12px_rgba(227,24,55,0.3)] transition-all"
              >
                {savingProfile ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl p-6 space-y-4">
          <div className="pb-2 border-b border-[#2A2A3E]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-prompt">
              <KeyRound className="w-4 h-4 text-brand-red" />
              เปลี่ยนรหัสผ่าน (Change Password)
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              การอัปเดตรหัสผ่านใหม่จะช่วยเพิ่มความปลอดภัยในการเข้าใช้งานระบบ
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label htmlFor="currentPass" className="text-xs text-gray-300 font-prompt">
                รหัสผ่านปัจจุบัน (Current Password):
              </Label>
              <Input
                id="currentPass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs focus-visible:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPass" className="text-xs text-gray-300 font-prompt">
                รหัสผ่านใหม่ (New Password):
              </Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs focus-visible:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPass" className="text-xs text-gray-300 font-prompt">
                ยืนยันรหัสผ่านใหม่ (Confirm New Password):
              </Label>
              <Input
                id="confirmPass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#0A0A0F] border-[#2A2A3E] text-white text-xs focus-visible:ring-brand-red"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={savingPassword}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt text-xs px-6 py-2 rounded-xl shadow-[0_0_12px_rgba(227,24,55,0.3)] transition-all"
              >
                {savingPassword ? 'กำลังอัปเดต...' : 'อัปเดตรหัสผ่านใหม่'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
