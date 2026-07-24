'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useCreateUser } from '@/features/users/hooks/useCreateUser';
import { useRoles } from '@/features/users/hooks/useRoles';
import { useUpdateUserRoles, useUpdateUserProfile } from '@/features/users/hooks/useUpdateUserRoles';
import { useActionLogs } from '@/features/users/hooks/useActionLogs';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  User,
  Settings,
  KeyRound,
  Power,
  Check,
  CheckCircle2,
  Eye,
  Code2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User as UserType, UserRole, ActionLog } from '@/types/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function AdminUsersPage() {
  const currentUsername = useAuthStore((state) => state.username);

  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState<ActionLog | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Single Unified User Management Modal State
  const [manageUserModal, setManageUserModal] = useState<UserType | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editCinemaId, setEditCinemaId] = useState<number | undefined>(undefined);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [savingUnified, setSavingUnified] = useState(false);


  // Form State for Creating User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CINEMA_MANAGER');
  const [newCinemaId, setNewCinemaId] = useState<number | undefined>(1);

  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission('users:manage');

  // Queries & Mutations
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useUsers({ enabled: canManageUsers });
  const { data: roles = [] } = useRoles({ enabled: canManageUsers });
  const { data: actionLogs = [] } = useActionLogs({ enabled: canManageUsers && activeTab === 'logs' });

  const createUserMutation = useCreateUser();
  const updateUserRolesMutation = useUpdateUserRoles();
  const updateUserProfileMutation = useUpdateUserProfile();

  const handleOpenManageUserModal = (user: UserType) => {
    setManageUserModal(user);
    setEditEmail(user.email || '');
    setEditCinemaId(user.cinemaId ?? undefined);
    setEditIsActive(user.isActive);

    const rawRoles = user.roles || (user.role ? [user.role] : []);
    const userRoleCodes: string[] = rawRoles.map((r: unknown) =>
      typeof r === 'string' ? r : (r as { code?: string })?.code || ''
    );
    const currentIds = roles
      .filter((r) => userRoleCodes.some((code) => code.toUpperCase() === r.code.toUpperCase()))
      .map((r) => r.id);

    setSelectedRoleIds(currentIds);
  };

  const handleSaveUnifiedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageUserModal) return;

    setSavingUnified(true);
    try {
      // 1. Update Profile (Email, Cinema Scope RLS, IsActive Status)
      await updateUserProfileMutation.mutateAsync({
        userId: manageUserModal.id,
        email: editEmail.trim(),
        cinemaId: editCinemaId,
        isActive: editIsActive,
      });

      // Calculate initial role IDs to check if roles were actually modified
      const rawRoles = manageUserModal.roles || (manageUserModal.role ? [manageUserModal.role] : []);
      const userRoleCodes: string[] = rawRoles.map((r: unknown) =>
        typeof r === 'string' ? r : (r as { code?: string })?.code || ''
      );
      const initialRoleIds = roles
        .filter((r) => userRoleCodes.some((code) => code.toUpperCase() === r.code.toUpperCase()))
        .map((r) => r.id)
        .sort((a, b) => a - b);
      const currentSelectedRoleIds = [...selectedRoleIds].sort((a, b) => a - b);

      const rolesChanged =
        initialRoleIds.length !== currentSelectedRoleIds.length ||
        initialRoleIds.some((id, idx) => id !== currentSelectedRoleIds[idx]);

      // 2. Update Roles ONLY IF roles were actually changed (and not self)
      if (manageUserModal.username !== currentUsername && selectedRoleIds.length > 0 && rolesChanged) {
        await updateUserRolesMutation.mutateAsync({
          userId: manageUserModal.id,
          roleIds: selectedRoleIds,
        });
      }

      setManageUserModal(null);
    } catch {
      // Handled by mutation toast error
    } finally {
      setSavingUnified(false);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    createUserMutation.mutate(
      {
        username: newUsername.trim(),
        passwordHash: newPassword,
        role: newRole,
        cinemaId: newRole === 'CINEMA_MANAGER' ? newCinemaId : undefined,
      },
      {
        onSuccess: () => {
          setCreateUserOpen(false);
          setNewUsername('');
          setNewPassword('');
        },
      }
    );
  };


  return (
    <PermissionGuard
      permission="users:manage"
      fallback={
        <div className="max-w-4xl mx-auto my-12 p-8 bg-red-950/20 border border-red-800/40 rounded-2xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-red-400 font-prompt">403 Forbidden - Access Restricted</h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto">
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้าจัดการผู้ใช้และกำหนดสิทธิ์ (Required Permission Code: <code className="text-red-400 font-mono font-bold">users:manage</code>)
          </p>
        </div>
      }
    >
      <div className="space-y-6 font-prompt">
        {/* Page Title Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-brand-red shadow-[0_0_12px_rgba(227,24,55,0.4)]" />
            <div>
              <h1 className="text-2xl font-bold text-white font-prompt">จัดการบัญชีพนักงานระบบ (Internal Staff Users)</h1>
              <p className="text-xs text-gray-400">บริหารจัดการบัญชีผู้ใช้งานพนักงาน กำหนดสาขาที่รับผิดชอบ (RLS) และเปิด/ปิดการใช้งานบัญชี</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => refetchUsers()}
              variant="outline"
              size="sm"
              className="border-[#2A2A3E] bg-[#1C1C27] hover:bg-[#2A2A3E] text-gray-300 text-xs font-prompt"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              รีเฟรชข้อมูล
            </Button>
            <Button
              onClick={() => setCreateUserOpen(true)}
              size="sm"
              className="bg-brand-red hover:bg-brand-red/90 text-white font-bold font-prompt text-xs px-4 shadow-[0_0_12px_rgba(227,24,55,0.3)] transition-all"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              เพิ่มพนักงานใหม่ (Create User)
            </Button>
          </div>
        </div>

        {/* Tab Navigation Segmented Pills */}
        <div className="flex border-b border-[#2A2A3E] gap-2">
          <button
            type="button"
            aria-pressed={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-prompt border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-brand-red text-white bg-[#1C1C27]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4 text-brand-red" />
            <span>บัญชีพนักงานหลังบ้าน ({users.length})</span>
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'logs'}
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-prompt border-b-2 transition-all ${
              activeTab === 'logs'
                ? 'border-brand-red text-white bg-[#1C1C27]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>บันทึกประวัติความปลอดภัย (Action Audit Logs)</span>
          </button>
        </div>

        {/* TAB 1: Internal Staff Users Management */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2A2A3E]">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 font-prompt">
                  <User className="w-4 h-4 text-brand-red" />
                  รายชื่อผู้ดูแลระบบและพนักงาน (Internal Staff Users)
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  จำกัดการบริหารจัดการเฉพาะพนักงานภายใน (Internal Administrative Users) เท่านั้น ตามหลัก SRS
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  placeholder="ค้นหาชื่อพนักงาน..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setUsersPage(1);
                  }}
                  className="pl-9 bg-[#0A0A0F] border-[#2A2A3E] text-white h-9 text-xs focus-visible:ring-brand-red font-prompt"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#2A2A3E] overflow-hidden bg-[#0A0A0F]">
              <Table>
                <TableHeader className="bg-[#0A0A0F]/80 border-b border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">User ID</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Username</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Assigned Role</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Assigned Cinema (RLS)</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Status</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold text-right font-prompt">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredUsers = users.filter((u) => {
                      const q = searchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        u.username.toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        u.id.toString().includes(q)
                      );
                    });
                    const paginatedUsers = filteredUsers.slice((usersPage - 1) * pageSize, usersPage * pageSize);

                    if (paginatedUsers.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-12 italic text-xs font-prompt">
                            ไม่พบข้อมูลผู้ใช้ในระบบตามคำค้นหา
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return paginatedUsers.map((user) => {
                      const isSelf = user.username === currentUsername;
                      return (
                        <TableRow key={user.id} className="border-gray-800/80 hover:bg-gray-800/40">
                          <TableCell className="font-mono text-xs text-brand-red font-bold">#{user.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">{user.username}</span>
                              {isSelf && (
                                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 px-1.5 py-0">
                                  You (Active)
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const rawRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role || 'CINEMA_MANAGER'];
                                return rawRoles.map((r: string | { code?: string }, idx: number) => {
                                  const rCode = typeof r === 'string' ? r : r.code || 'CINEMA_MANAGER';
                                  return (
                                    <Badge
                                      key={`${user.id}-role-${idx}`}
                                      className={`text-xs px-2.5 py-0.5 ${
                                        rCode === 'SYSTEM_ADMIN'
                                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                          : rCode === 'CINEMA_MANAGER'
                                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                          : 'bg-gray-800 text-gray-300 border-gray-700'
                                      }`}
                                    >
                                      {rCode}
                                    </Badge>
                                  );
                                });
                              })()}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-gray-300">
                            {user.cinemaId ? (
                              <span className="flex items-center gap-1.5 text-blue-300">
                                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                                {user.cinemaId === 1 ? 'Sriracha' : user.cinemaId === 2 ? 'Bangsaen' : `Cinema #${user.cinemaId}`}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">All Cinemas (Global System Admin)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.isActive
                                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 px-2.5 py-0.5 text-xs'
                                  : 'border-red-500/40 text-red-400 bg-red-950/20 px-2.5 py-0.5 text-xs font-semibold'
                              }
                            >
                              {user.isActive ? 'Active (เปิดใช้งาน)' : 'Disabled (ปิดใช้งาน)'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenManageUserModal(user)}
                              className="border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs px-3 h-8 flex items-center gap-1.5 ml-auto"
                            >
                              <Settings className="w-3.5 h-3.5 text-brand-red" />
                              <span>จัดการข้อมูล & สิทธิ์</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Users Pagination */}
            {(() => {
              const filteredUsers = users.filter((u) => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return (
                  u.username.toLowerCase().includes(q) ||
                  (u.email || '').toLowerCase().includes(q) ||
                  u.id.toString().includes(q)
                );
              });
              const totalUsersPages = Math.ceil(filteredUsers.length / pageSize) || 1;

              if (totalUsersPages <= 1) return null;

              return (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 font-prompt">
                  <span className="text-xs text-gray-400">
                    แสดงพนักงาน {(usersPage - 1) * pageSize + 1} - {Math.min(usersPage * pageSize, filteredUsers.length)} จากทั้งหมด {filteredUsers.length} คน
                  </span>
                  <Pagination className="w-auto mx-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setUsersPage((p) => Math.max(1, p - 1));
                          }}
                          disabled={usersPage === 1}
                          className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                        />
                      </PaginationItem>
                      {Array.from({ length: totalUsersPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            type="button"
                            isActive={usersPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setUsersPage(page);
                            }}
                            className={
                              usersPage === page
                                ? 'bg-brand-red text-white border-brand-red shadow-[0_0_10px_rgba(227,24,55,0.3)] cursor-default'
                                : 'border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer'
                            }
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
                            setUsersPage((p) => Math.min(totalUsersPages, p + 1));
                          }}
                          disabled={usersPage === totalUsersPages}
                          className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: Security & Audit Action Logs */}
        {activeTab === 'logs' && (
          <div className="rounded-2xl border border-[#2A2A3E] bg-[#1C1C27] overflow-hidden shadow-xl p-6 space-y-4 font-prompt">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#2A2A3E]">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 font-prompt">
                  <Shield className="w-4 h-4 text-blue-400" />
                  ประวัติการทำรายการในระบบ (Security Action Audit Logs)
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  ระบบบันทึกประวัติความปลอดภัยและการกระทำสำคัญย้อนหลัง (ISO 27001 & PDPA Audit Trail)
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  placeholder="ค้นหา Log ID, Action, Actor..."
                  value={logSearchQuery}
                  onChange={(e) => {
                    setLogSearchQuery(e.target.value);
                    setLogsPage(1);
                  }}
                  className="pl-9 bg-[#0A0A0F] border-[#2A2A3E] text-white h-9 text-xs focus-visible:ring-brand-red font-prompt"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#2A2A3E] overflow-hidden bg-[#0A0A0F]">
              <Table>
                <TableHeader className="bg-[#0A0A0F]/80 border-b border-[#2A2A3E]">
                  <TableRow className="border-[#2A2A3E] hover:bg-transparent">
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Log ID</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Status / Severity</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Actor (Who & IP)</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Action (What)</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Target (Where)</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold font-prompt">Timestamp (When)</TableHead>
                    <TableHead className="text-gray-400 text-xs font-semibold text-right font-prompt">Payload Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const filteredLogs = actionLogs.filter((log) => {
                      const q = logSearchQuery.toLowerCase();
                      const action = (log.actionName || log.actionType || '').toLowerCase();
                      const email = (log.actorEmail || '').toLowerCase();
                      const role = (log.actorRole || '').toLowerCase();
                      const user = (log.user?.username || '').toLowerCase();
                      const ip = (log.ipAddress || '').toLowerCase();
                      const target = (log.targetType || log.entityName || '').toLowerCase();
                      const targetId = (log.targetId || (log.entityId ? log.entityId.toString() : '')).toLowerCase();
                      return (
                        log.id.toString().includes(q) ||
                        action.includes(q) ||
                        email.includes(q) ||
                        role.includes(q) ||
                        user.includes(q) ||
                        ip.includes(q) ||
                        target.includes(q) ||
                        targetId.includes(q)
                      );
                    });

                    const paginatedLogs = filteredLogs.slice((logsPage - 1) * pageSize, logsPage * pageSize);

                    if (paginatedLogs.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-12 italic text-xs font-prompt">
                            ยังไม่มีรายการบันทึก Action Log ในระบบ หรือไม่พบข้อมูลตามคำค้นหา
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return paginatedLogs.map((log) => {
                      const level = (log.logLevel || 'INFO').toUpperCase();
                      const statusCode = log.statusCode || 200;
                      const actionName = log.actionName || log.actionType || 'N/A';
                      const method = log.httpMethod || 'POST';

                      return (
                        <TableRow key={log.id} className="border-[#2A2A3E]/60 hover:bg-gray-800/40">
                          <TableCell className="font-mono text-xs text-brand-red font-bold">#{log.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono px-2 py-0.5 ${
                                  statusCode >= 200 && statusCode < 300
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : statusCode >= 400 && statusCode < 500
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                                }`}
                              >
                                {statusCode}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
                                  level === 'INFO'
                                    ? 'border-blue-500/30 text-blue-400 bg-blue-950/20'
                                    : level === 'WARNING'
                                    ? 'border-amber-500/30 text-amber-400 bg-amber-950/20'
                                    : 'border-red-500/30 text-red-400 bg-red-950/20'
                                }`}
                              >
                                {level}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">
                                  {log.user?.username || (log.userId ? `User #${log.userId}` : 'Anonymous / System')}
                                </span>
                                {log.actorRole && (
                                  <Badge variant="outline" className="text-[9px] font-mono border-gray-700 bg-gray-800 text-gray-300 px-1 py-0">
                                    {log.actorRole}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                                <span>{log.actorEmail || 'No Email'}</span>
                                {log.ipAddress && <span className="text-gray-500">({log.ipAddress})</span>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                className={`text-[10px] font-mono px-2 py-0.5 ${
                                  method === 'DELETE'
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : method === 'PUT'
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : method === 'POST'
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}
                              >
                                {method}
                              </Badge>
                              <span className="text-xs font-mono font-bold text-gray-200">{actionName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono">
                              <span className="text-gray-300">{log.targetType || log.entityName || '-'}</span>
                              {(log.targetId || log.entityId) && (
                                <span className="text-brand-red font-bold ml-1.5">#{log.targetId || log.entityId}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-400 font-mono">
                            {new Date(log.timestamp).toLocaleString('th-TH')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLogDetail(log)}
                              className="border-[#2A2A3E] bg-[#1C1C27] hover:bg-[#2A2A3E] text-gray-300 text-xs px-2.5 h-7 flex items-center gap-1 ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>ดู JSON Payload</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Action Logs Pagination */}
            {(() => {
              const filteredLogs = actionLogs.filter((log) => {
                const q = logSearchQuery.toLowerCase();
                const action = (log.actionName || log.actionType || '').toLowerCase();
                const email = (log.actorEmail || '').toLowerCase();
                const role = (log.actorRole || '').toLowerCase();
                const user = (log.user?.username || '').toLowerCase();
                const ip = (log.ipAddress || '').toLowerCase();
                const target = (log.targetType || log.entityName || '').toLowerCase();
                const targetId = (log.targetId || (log.entityId ? log.entityId.toString() : '')).toLowerCase();
                return (
                  log.id.toString().includes(q) ||
                  action.includes(q) ||
                  email.includes(q) ||
                  role.includes(q) ||
                  user.includes(q) ||
                  ip.includes(q) ||
                  target.includes(q) ||
                  targetId.includes(q)
                );
              });
              const totalLogsPages = Math.ceil(filteredLogs.length / pageSize) || 1;

              if (totalLogsPages <= 1) return null;

              return (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 font-prompt">
                  <span className="text-xs text-gray-400">
                    แสดง Log {(logsPage - 1) * pageSize + 1} - {Math.min(logsPage * pageSize, filteredLogs.length)} จากทั้งหมด {filteredLogs.length} รายการ
                  </span>
                  <Pagination className="w-auto mx-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLogsPage((p) => Math.max(1, p - 1));
                          }}
                          disabled={logsPage === 1}
                          className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                        />
                      </PaginationItem>
                      {Array.from({ length: totalLogsPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            type="button"
                            isActive={logsPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setLogsPage(page);
                            }}
                            className={
                              logsPage === page
                                ? 'bg-brand-red text-white border-brand-red shadow-[0_0_10px_rgba(227,24,55,0.3)] cursor-default'
                                : 'border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer'
                            }
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
                            setLogsPage((p) => Math.min(totalLogsPages, p + 1));
                          }}
                          disabled={logsPage === totalLogsPages}
                          className="border-[#2A2A3E] text-gray-300 hover:bg-gray-800 cursor-pointer"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              );
            })()}
          </div>
        )}

        {/* MODAL 1: Create Internal User Dialog */}
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-red" />
                สร้างผู้ใช้งานพนักงานใหม่ (Internal Staff)
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                กำหนดชื่อเข้าใช้งาน รหัสผ่าน และขอบเขตสาขาโรงภาพยนตร์ที่รับผิดชอบ
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-username" className="text-xs text-gray-300">
                  ชื่อผู้ใช้งาน (Username):
                </Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. sriracha_mgr"
                  required
                  className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-red"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs text-gray-300">
                  รหัสผ่านเริ่มต้น (Password):
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gray-800 border-gray-700 text-white focus-visible:ring-brand-red"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-300 font-prompt">
                  กำหนดบทบาทหลัก (User Role):
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { code: 'CINEMA_MANAGER', label: 'CINEMA_MANAGER (ผู้จัดการสาขา)', desc: 'จัดการภาพยนตร์ รอบฉาย และรายการจองประจำสาขา' },
                    { code: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN (ผู้ดูแลระบบหลัก)', desc: 'สิทธิ์เต็มในการบริหารจัดการระบบและผู้ใช้งาน' },
                    { code: 'Staff', label: 'COUNTER_STAFF (พนักงานหน้าเคาน์เตอร์)', desc: 'ออกตั๋วและดูรายการจองประจำสาขา' },
                  ].map((r) => {
                    const isSelected = newRole === r.code;
                    return (
                      <button
                        key={r.code}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setNewRole(r.code as UserRole)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-brand-red/15 border-brand-red text-white shadow-[0_0_10px_rgba(227,24,55,0.2)]'
                            : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-prompt text-white">{r.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-red" />}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {newRole === 'CINEMA_MANAGER' && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-300 font-prompt">
                    ขอบเขตสาขาที่รับผิดชอบ (Row-Level Security Scope):
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 1, label: 'สาขา ศรีราชา (Cinema #1)' },
                      { id: 2, label: 'สาขา บางแสน (Cinema #2)' },
                    ].map((c) => {
                      const isSelected = newCinemaId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setNewCinemaId(c.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold font-prompt transition-all text-center ${
                            isSelected
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                              : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateUserOpen(false)}
                  className="border-gray-700 bg-gray-800 text-gray-300 text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs px-5"
                >
                  {createUserMutation.isPending ? 'กำลังบันทึก...' : 'สร้างพนักงาน'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* UNIFIED MODAL: Manage User Profile, RLS Scope, Roles, and Status */}
        <Dialog open={!!manageUserModal} onOpenChange={() => setManageUserModal(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-prompt text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-red" />
                จัดการข้อมูลพนักงาน & สิทธิ์การใช้งานระบบ
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                ปรับเปลี่ยนข้อมูลพนักงาน ขอบเขตสาขา RLS บทบาทการทำงาน และสถานะบัญชี (#{manageUserModal?.id} - {manageUserModal?.username})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveUnifiedUser} className="space-y-6 pt-2">
              {/* SECTION 1: Profile & Cinema Scope RLS */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-800/40 border border-gray-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800 pb-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  1. ข้อมูลส่วนตัว & ขอบเขตสาขา (RLS Scope)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-300">Username:</Label>
                    <Input
                      value={manageUserModal?.username || ''}
                      disabled
                      className="bg-gray-800/60 border-gray-700 text-gray-400 text-xs cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="uni-email" className="text-xs text-gray-300">
                      อีเมลพนักงาน (Email):
                    </Label>
                    <Input
                      id="uni-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white text-xs focus-visible:ring-brand-red"
                      placeholder="staff@natureminiplex.com"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <Label className="text-xs text-gray-300 font-prompt">
                    ขอบเขตสาขาโรงภาพยนตร์ (Cinema Scope RLS):
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: undefined, label: 'ทุกสาขา (Global)' },
                      { val: 1, label: 'ศรีราชา (#1)' },
                      { val: 2, label: 'บางแสน (#2)' },
                    ].map((c) => {
                      const isSelected = editCinemaId === c.val;
                      return (
                        <button
                          key={String(c.val)}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setEditCinemaId(c.val)}
                          className={`p-2.5 rounded-xl border text-xs font-bold font-prompt transition-all text-center ${
                            isSelected
                              ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                              : 'bg-[#0A0A0F] border-[#2A2A3E] text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Role Assignments */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#1C1C27] border border-[#2A2A3E] shadow-inner">
                <div className="flex items-center justify-between border-b border-[#2A2A3E] pb-2.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-prompt">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    2. กำหนดบทบาทพนักงาน (Role Assignments)
                  </h4>
                  {manageUserModal?.username === currentUsername && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-950/20 px-2 py-0.5">
                      Anti-Privilege Escalation Protected
                    </Badge>
                  )}
                </div>

                {manageUserModal?.username === currentUsername ? (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>ตามหลักความปลอดภัย พนักงานไม่สามารถแก้ไขบทบาท Role ของตนเองได้</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {roles.map((r) => {
                      const isChecked = selectedRoleIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          aria-pressed={isChecked}
                          onClick={() => {
                            setSelectedRoleIds((prev) =>
                              prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                            );
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                            isChecked
                              ? 'bg-brand-red/15 border-brand-red text-white shadow-[0_0_12px_rgba(227,24,55,0.25)]'
                              : 'bg-[#0A0A0F]/60 border-[#2A2A3E] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isChecked
                                  ? 'bg-brand-red border-brand-red text-white shadow-sm'
                                  : 'border-gray-600 bg-gray-900 group-hover:border-gray-500'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white font-prompt block">{r.name}</span>
                              <span className="text-[11px] text-gray-400">{r.description || `สิทธิ์ระดับ ${r.code}`}</span>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono px-2 py-0.5 transition-colors ${
                              isChecked
                                ? 'bg-brand-red/20 text-brand-red border-brand-red/40'
                                : 'bg-gray-800/60 border-gray-700 text-gray-400'
                            }`}
                          >
                            {r.code}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 3: Account Status */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#1C1C27] border border-[#2A2A3E] shadow-inner">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2A2A3E] pb-2.5 font-prompt">
                  <Power className="w-4 h-4 text-emerald-400" />
                  3. สถานะการใช้งานบัญชี (Account Status)
                </h4>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    aria-pressed={editIsActive === true}
                    onClick={() => setEditIsActive(true)}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-bold font-prompt ${
                      editIsActive === true
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.25)]'
                        : 'bg-[#0A0A0F]/60 border-[#2A2A3E] text-gray-500 hover:border-gray-700 hover:text-gray-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${editIsActive === true ? 'text-emerald-400' : 'text-gray-600'}`} />
                    <span>Active (เปิดใช้งานปกติ)</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={editIsActive === false}
                    onClick={() => setEditIsActive(false)}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border transition-all text-xs font-bold font-prompt ${
                      editIsActive === false
                        ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.25)]'
                        : 'bg-[#0A0A0F]/60 border-[#2A2A3E] text-gray-500 hover:border-gray-700 hover:text-gray-300'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 ${editIsActive === false ? 'text-red-400' : 'text-gray-600'}`} />
                    <span>Disabled (ปิดใช้งานชั่วคราว)</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 italic pt-0.5">
                  * บัญชีที่ปิดใช้งานจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลและประวัติจะถูกจัดเก็บตามมาตรฐานความปลอดภัย
                </p>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManageUserModal(null)}
                  className="border-[#2A2A3E] bg-[#1C1C27] text-gray-300 hover:bg-gray-800 text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={savingUnified}
                  className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs px-5 shadow-[0_0_12px_rgba(227,24,55,0.3)]"
                >
                  {savingUnified ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลงทั้งหมด'}
                </Button>
              </DialogFooter>

            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL: Security Action Log Payload Detail */}
        <Dialog open={!!selectedLogDetail} onOpenChange={() => setSelectedLogDetail(null)}>
          <DialogContent className="bg-[#1C1C27] border-[#2A2A3E] text-white sm:max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto font-prompt">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-prompt text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                รายละเอียด Action Audit Log Payload (#{selectedLogDetail?.id})
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                {selectedLogDetail?.actionName || selectedLogDetail?.actionType} — {new Date(selectedLogDetail?.timestamp || '').toLocaleString('th-TH')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#0A0A0F] p-3.5 rounded-xl border border-[#2A2A3E]">
                <div>
                  <span className="text-gray-400 block">Actor:</span>
                  <span className="font-bold text-white">{selectedLogDetail?.user?.username || selectedLogDetail?.actorEmail || `User #${selectedLogDetail?.userId}`}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Actor Role:</span>
                  <span className="font-bold text-amber-400 font-mono">{selectedLogDetail?.actorRole || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">IP Address:</span>
                  <span className="font-bold text-blue-400 font-mono">{selectedLogDetail?.ipAddress || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Status Code:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedLogDetail?.statusCode || 200}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-red" />
                  JSON Details & Changes (PDPA Redacted):
                </Label>
                <pre className="p-4 bg-[#0A0A0F] rounded-xl border border-[#2A2A3E] text-xs font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed">
                  {selectedLogDetail?.detailJson
                    ? (() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLogDetail.detailJson), null, 2);
                        } catch {
                          return selectedLogDetail.detailJson;
                        }
                      })()
                    : JSON.stringify({ before: null, after: null, message: "ไม่มีข้อมูล Payload เพิ่มเติม" }, null, 2)}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="bg-[#2A2A3E] hover:bg-gray-700 text-white font-bold text-xs px-5 font-prompt"
              >
                ปิดหน้าต่าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PermissionGuard>
  );
}

