'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useRoles, usePermissionsList, useUpdateRolePermissions } from '@/features/users/hooks/useRoles';
import {
  filterPermissions,
  groupPermissionsByModule,
  isSensitivePermission,
} from '@/lib/permission-groups';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { usePermissionMatrixDirtyStore } from '@/store/usePermissionMatrixDirtyStore';
import { confirmModal } from '@/store/useConfirmStore';
import { toast } from '@/store/useToastStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import type { Permission, Role } from '@/types/api';
import { cn } from '@/lib/utils';

function buildInitialMatrix(
  roles: Role[],
  permissionDefs: Permission[]
): Record<number, number[]> {
  const initialMap: Record<number, number[]> = {};

  roles.forEach((r) => {
    let assignedIds: number[] = [];

    if (r.permissionIds && r.permissionIds.length > 0) {
      assignedIds = [...r.permissionIds];
    } else if (r.permissions && r.permissions.length > 0) {
      if (typeof r.permissions[0] === 'string') {
        assignedIds = permissionDefs
          .filter((p) => (r.permissions as unknown as string[]).includes(p.code))
          .map((p) => p.id!)
          .filter(Boolean);
      } else {
        assignedIds = (r.permissions as Permission[]).map((p) => p.id!).filter(Boolean);
      }
    }

    if (assignedIds.length === 0 && r.code === 'SYSTEM_ADMIN' && permissionDefs.length > 0) {
      assignedIds = permissionDefs.map((p) => p.id!).filter(Boolean);
    }

    initialMap[r.id] = assignedIds;
  });

  return initialMap;
}

function matricesEqual(
  a: Record<number, number[]>,
  b: Record<number, number[]>
): boolean {
  const keysA = Object.keys(a).map(Number).sort();
  const keysB = Object.keys(b).map(Number).sort();
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const listA = [...(a[key] || [])].sort((x, y) => x - y);
    const listB = [...(b[key] || [])].sort((x, y) => x - y);
    if (listA.length !== listB.length) return false;
    if (listA.some((v, i) => v !== listB[i])) return false;
  }
  return true;
}

function isSystemAdminRole(role: Role): boolean {
  return role.code === 'SYSTEM_ADMIN';
}

export function PermissionMatrix() {
  const { data: roles = [], isLoading: loadingRoles } = useRoles();
  const { data: permissionDefs = [], isLoading: loadingPermissions } = usePermissionsList();
  const updateRolePermissionsMutation = useUpdateRolePermissions();

  const [baseline, setBaseline] = useState<Record<number, number[]>>({});
  const [matrixState, setMatrixState] = useState<Record<number, number[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const isLoading = loadingRoles || loadingPermissions;
  const isDirty = useMemo(
    () => !matricesEqual(matrixState, baseline),
    [matrixState, baseline]
  );

  const setDirty = usePermissionMatrixDirtyStore((s) => s.setDirty);

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  const rolesAndPermsKey = useMemo(() => {
    if (roles.length === 0) return '';
    return JSON.stringify({
      r: roles.map((r) => [r.id, r.permissionIds || [], r.permissions || []]),
      p: permissionDefs.map((p) => [p.id, p.code]),
    });
  }, [roles, permissionDefs]);

  useEffect(() => {
    if (!rolesAndPermsKey || roles.length === 0) return;
    const initial = buildInitialMatrix(roles, permissionDefs);
    setBaseline(initial);
    setMatrixState(initial);
  }, [rolesAndPermsKey]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const filteredPermissions = useMemo(
    () => filterPermissions(permissionDefs, searchQuery),
    [permissionDefs, searchQuery]
  );

  const grouped = useMemo(
    () => groupPermissionsByModule(filteredPermissions),
    [filteredPermissions]
  );

  const dirtyRoleIds = useMemo(() => {
    return roles
      .filter((role) => {
        const current = [...(matrixState[role.id] || [])].sort((a, b) => a - b);
        const original = [...(baseline[role.id] || [])].sort((a, b) => a - b);
        if (current.length !== original.length) return true;
        return current.some((v, i) => v !== original[i]);
      })
      .map((r) => r.id);
  }, [roles, matrixState, baseline]);

  const applyToggle = useCallback((roleId: number, permissionId: number) => {
    setMatrixState((prev) => {
      const currentList = prev[roleId] || [];
      const updated = currentList.includes(permissionId)
        ? currentList.filter((id) => id !== permissionId)
        : [...currentList, permissionId];
      return { ...prev, [roleId]: updated };
    });
  }, []);

  const handleToggle = useCallback(
    (role: Role, permission: Permission) => {
      if (!permission.id) return;

      const isChecked = (matrixState[role.id] || []).includes(permission.id);
      const willEnable = !isChecked;
      const sensitive = isSensitivePermission(permission);
      const systemRole = isSystemAdminRole(role);

      if (systemRole || (sensitive && willEnable)) {
        confirmModal({
          title: systemRole
            ? 'ยืนยันการแก้ไขสิทธิ์ Super Admin'
            : 'ยืนยันการเปิดสิทธิ์ที่มีความเสี่ยงสูง',
          description: systemRole
            ? `คุณกำลังเปลี่ยนแปลงสิทธิ์ของบทบาท ${role.name} (${role.code}) สำหรับ ${permission.code} การตั้งค่าผิดพลาดอาจกระทบความปลอดภัยของระบบทั้งหมด`
            : `สิทธิ์ "${permission.code}" เป็นสิทธิ์ระดับสูง (${permission.description || permission.action}). ต้องการ${willEnable ? 'เปิด' : 'ปิด'}ให้บทบาท ${role.name} หรือไม่?`,
          confirmText: 'ยืนยันการเปลี่ยนแปลง',
          cancelText: 'ยกเลิก',
          variant: 'destructive',
          icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
          onConfirm: () => applyToggle(role.id, permission.id!),
        });
        return;
      }

      applyToggle(role.id, permission.id);
    },
    [matrixState, applyToggle]
  );

  const handleSelectAllForRole = (role: Role) => {
    const allIds = permissionDefs.map((p) => p.id!).filter(Boolean);
    const run = () => setMatrixState((prev) => ({ ...prev, [role.id]: allIds }));

    if (isSystemAdminRole(role)) {
      confirmModal({
        title: 'เลือกสิทธิ์ทั้งหมดสำหรับ Super Admin',
        description: `ยืนยันการมอบสิทธิ์ทั้งหมด (${allIds.length} รายการ) ให้บทบาท ${role.name}?`,
        confirmText: 'เลือกทั้งหมด',
        cancelText: 'ยกเลิก',
        variant: 'warning',
        onConfirm: run,
      });
      return;
    }
    run();
  };

  const handleClearAllForRole = (role: Role) => {
    const run = () => setMatrixState((prev) => ({ ...prev, [role.id]: [] }));

    confirmModal({
      title: 'ล้างสิทธิ์ทั้งหมดของบทบาท',
      description: `บทบาท ${role.name} จะไม่มีสิทธิ์ใด ๆ จนกว่าจะบันทึกและกำหนดใหม่ การดำเนินการนี้อาจทำให้ผู้ใช้ในบทบาทนี้ใช้งานระบบไม่ได้`,
      confirmText: 'ล้างสิทธิ์',
      cancelText: 'ยกเลิก',
      variant: 'destructive',
      onConfirm: run,
    });
  };

  const handleSelectAllForModule = (role: Role, modulePermissionIds: number[]) => {
    setMatrixState((prev) => {
      const current = new Set(prev[role.id] || []);
      modulePermissionIds.forEach((id) => current.add(id));
      return { ...prev, [role.id]: Array.from(current) };
    });
  };

  const handleClearModuleForRole = (role: Role, modulePermissionIds: number[]) => {
    setMatrixState((prev) => {
      const idSet = new Set(modulePermissionIds);
      const updated = (prev[role.id] || []).filter((id) => !idSet.has(id));
      return { ...prev, [role.id]: updated };
    });
  };

  const handleDiscard = () => {
    if (!isDirty) return;
    confirmModal({
      title: 'ยกเลิกการเปลี่ยนแปลงที่ยังไม่บันทึก?',
      description: 'การเปลี่ยนแปลงใน Permission Matrix จะถูกรีเซ็ตกลับเป็นค่าล่าสุดจากเซิร์ฟเวอร์',
      confirmText: 'ทิ้งการเปลี่ยนแปลง',
      cancelText: 'กลับไปแก้ไข',
      variant: 'warning',
      onConfirm: () => {
        setMatrixState(baseline);
        toast.info('รีเซ็ตการเปลี่ยนแปลงแล้ว');
      },
    });
  };

  const handleSaveAll = async () => {
    if (!isDirty || dirtyRoleIds.length === 0) return;

    const touchesSystemAdmin = roles.some(
      (r) => dirtyRoleIds.includes(r.id) && isSystemAdminRole(r)
    );

    const proceed = async () => {
      setSaving(true);
      try {
        await Promise.all(
          dirtyRoleIds.map((roleId) =>
            updateRolePermissionsMutation.mutateAsync({
              roleId,
              permissionIds: matrixState[roleId] || [],
              silent: true,
            })
          )
        );
        setBaseline(matrixState);
        toast.success(`บันทึกสิทธิ์สำเร็จ (${dirtyRoleIds.length} บทบาท)`);
      } catch {
        toast.error('เกิดข้อผิดพลาดในการบันทึกสิทธิ์บางบทบาท');
      } finally {
        setSaving(false);
      }
    };

    if (touchesSystemAdmin) {
      confirmModal({
        title: 'บันทึกการเปลี่ยนแปลงที่มีผลต่อ Super Admin',
        description:
          'มีการแก้ไขสิทธิ์ของบทบาทระดับสูง โปรดตรวจสอบอีกครั้งก่อนยืนยัน การบันทึกจะมีผลทันทีกับผู้ใช้ทั้งหมดในบทบาทนั้น',
        confirmText: 'บันทึกการเปลี่ยนแปลง',
        cancelText: 'ยกเลิก',
        variant: 'destructive',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        onConfirm: proceed,
      });
      return;
    }

    await proceed();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl bg-surface-elevated" />
        <Skeleton className="h-64 w-full rounded-2xl bg-surface-elevated" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <Card className="bg-surface-elevated border-surface-border text-white rounded-2xl">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          ไม่พบบทบาทในระบบ — ตรวจสอบการเชื่อมต่อ Backend API `/api/roles`
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6 font-prompt', isDirty && 'pb-24')}>
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาสิทธิ์ (code, resource, action)..."
            className="pl-9 bg-[#0A0A0F] border-[#2A2A3E] text-white h-9 text-xs focus-visible:ring-brand-red font-prompt"
            aria-label="ค้นหาสิทธิ์"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs font-prompt">
              มีการเปลี่ยนแปลงที่ยังไม่บันทึก · {dirtyRoleIds.length} บทบาท
            </Badge>
          )}
          <Badge variant="outline" className="border-[#2A2A3E] bg-[#1C1C27] text-gray-400 text-xs font-mono">
            {permissionDefs.length} สิทธิ์ · {roles.length} บทบาท
          </Badge>
        </div>
      </div>

      {/* Role quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {roles.map((role) => {
          const count = (matrixState[role.id] || []).length;
          const roleDirty = dirtyRoleIds.includes(role.id);
          return (
            <div
              key={role.id}
              className={cn(
                'rounded-2xl border bg-[#1C1C27] p-4 space-y-3 shadow-lg',
                roleDirty ? 'border-amber-500/50' : 'border-[#2A2A3E]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white font-prompt truncate">
                      {role.name}
                    </h3>
                    {isSystemAdminRole(role) && (
                      <Badge className="bg-brand-red/20 text-brand-red border-brand-red/40 text-[10px]">
                        Critical
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">{role.code}</p>
                </div>
                <Badge
                  className={cn(
                    'text-[10px] shrink-0 font-mono',
                    roleDirty
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  )}
                >
                  {count}/{permissionDefs.length}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectAllForRole(role)}
                  className="flex-1 h-8 text-[11px] border-[#2A2A3E] bg-[#0A0A0F] hover:bg-[#2A2A3E] text-gray-300 font-prompt"
                >
                  เลือกทั้งหมด
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearAllForRole(role)}
                  className="flex-1 h-8 text-[11px] border-[#2A2A3E] bg-[#0A0A0F] hover:bg-[#2A2A3E] text-gray-300 font-prompt"
                >
                  ล้างทั้งหมด
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grouped matrix */}
      {grouped.length === 0 ? (
        <Card className="bg-[#1C1C27] border-[#2A2A3E] rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-gray-400 font-prompt">
            ไม่พบสิทธิ์ที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
          </CardContent>
        </Card>
      ) : (
        grouped.map(({ group, permissions: modulePerms }) => {
          const Icon = group.icon;
          const moduleIds = modulePerms.map((p) => p.id!).filter(Boolean);

          return (
            <Card
              key={group.id}
              className="bg-[#1C1C27] border-[#2A2A3E] text-white rounded-2xl shadow-xl overflow-hidden"
            >
              <CardHeader className="border-b border-[#2A2A3E] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-red/15 border border-brand-red/30 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-red" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold font-prompt text-white flex items-center gap-2 flex-wrap">
                        {group.labelTh}
                        <span className="text-xs font-normal text-gray-400 font-mono">
                          ({group.label})
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-400 mt-1 font-prompt">
                        {group.description} · {modulePerms.length} สิทธิ์
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {roles.map((role) => (
                      <div
                        key={`${group.id}-${role.id}`}
                        className="inline-flex items-center rounded-lg border border-[#2A2A3E] bg-[#0A0A0F] overflow-hidden"
                      >
                        <span className="px-2 py-1 text-[10px] font-mono text-gray-300 border-r border-[#2A2A3E]">
                          {role.code}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={`เลือกทั้งโมดูลให้ ${role.code}`}
                          onClick={() => handleSelectAllForModule(role, moduleIds)}
                          className="h-7 px-2 text-[10px] rounded-none text-muted-foreground hover:text-emerald-400"
                        >
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={`ล้างโมดูลของ ${role.code}`}
                          onClick={() => handleClearModuleForRole(role, moduleIds)}
                          className="h-7 px-2 text-[10px] rounded-none text-muted-foreground hover:text-rose-400"
                        >
                          Clear
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Desktop matrix table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#2A2A3E] bg-[#0A0A0F]/80">
                        <th className="text-left text-xs font-semibold text-gray-400 font-prompt px-5 py-3 sticky left-0 bg-[#1C1C27] z-10 min-w-[240px]">
                          สิทธิ์ (Permission)
                        </th>
                        {roles.map((role) => (
                          <th
                            key={role.id}
                            className="text-center text-xs font-semibold text-gray-400 font-prompt px-4 py-3 min-w-[120px]"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-white font-prompt">{role.name}</span>
                              <span className="font-mono text-[10px] text-gray-400">{role.code}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {modulePerms.map((permission) => {
                        const sensitive = isSensitivePermission(permission);
                        return (
                          <tr
                            key={permission.id}
                            className={cn(
                              'border-b border-[#2A2A3E]/60 hover:bg-[#0A0A0F]/50 transition-colors',
                              sensitive && 'bg-rose-950/20'
                            )}
                          >
                            <td className="px-5 py-3.5 sticky left-0 bg-[#1C1C27] z-10">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <code className="text-xs font-mono font-bold text-white">
                                    {permission.code}
                                  </code>
                                  {sensitive && (
                                    <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] gap-1 font-prompt">
                                      <ShieldAlert className="w-3 h-3" />
                                      Sensitive
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 leading-snug font-prompt">
                                  {permission.description ||
                                    `${permission.action} on ${permission.resource}`}
                                </p>
                              </div>
                            </td>
                            {roles.map((role) => {
                              const checked = (matrixState[role.id] || []).includes(
                                permission.id!
                              );
                              return (
                                <td key={role.id} className="px-4 py-3.5 text-center">
                                  <div className="inline-flex justify-center">
                                    <Switch
                                      checked={checked}
                                      onCheckedChange={() => handleToggle(role, permission)}
                                      aria-label={`${permission.code} for ${role.code}`}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked cards */}
                <div className="md:hidden divide-y divide-surface-border">
                  {modulePerms.map((permission) => {
                    const sensitive = isSensitivePermission(permission);
                    return (
                      <div
                        key={permission.id}
                        className={cn('p-4 space-y-3', sensitive && 'bg-rose-950/10')}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-xs font-mono font-bold text-white">
                              {permission.code}
                            </code>
                            {sensitive && (
                              <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px]">
                                Sensitive
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {permission.description ||
                              `${permission.action} on ${permission.resource}`}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {roles.map((role) => {
                            const checked = (matrixState[role.id] || []).includes(
                              permission.id!
                            );
                            return (
                              <div
                                key={role.id}
                                className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-base/40 px-3 py-2"
                              >
                                <span className="text-xs text-muted-foreground font-mono">
                                  {role.code}
                                </span>
                                <Switch
                                  checked={checked}
                                  onCheckedChange={() => handleToggle(role, permission)}
                                  aria-label={`${permission.code} for ${role.code}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Toggle = มอบ/ถอนสิทธิ์ต่อบทบาท
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          Sensitive = ต้องยืนยันก่อนเปิดใช้งาน
        </span>
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Super Admin = ยืนยันทุกครั้งที่มีการเปลี่ยนแปลง
        </span>
      </div>

      {/* Fixed dirty-state action bar */}
      {isDirty && (
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
          <div className="md:pl-64">
            <div className="pointer-events-auto mx-auto max-w-7xl px-4 sm:px-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-surface-elevated/95 backdrop-blur-md shadow-2xl shadow-black/40 px-4 py-3 glass">
                <div className="flex items-center gap-2 text-sm text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    มีการเปลี่ยนแปลงที่ยังไม่บันทึกใน{' '}
                    <strong className="text-white">{dirtyRoleIds.length}</strong> บทบาท
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={saving}
                    className="border-surface-border text-muted-foreground hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    ทิ้งการเปลี่ยนแปลง
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="bg-brand-red hover:bg-brand-red/90 text-white font-bold"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
