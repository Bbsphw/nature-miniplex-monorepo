import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';
import type { Role, Permission } from '@/types/api';

export function useRoles(options?: { enabled?: boolean }) {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get<Role[]>('/api/roles');
      return data;
    },
    enabled: options?.enabled ?? true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403 || error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function usePermissionsList() {
  return useQuery<Permission[]>({
    queryKey: ['permissions-list'],
    queryFn: async () => {
      const { data } = await apiClient.get<Permission[]>('/api/roles/permissions');
      return data;
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
      silent?: boolean;
    }) => {
      const { data } = await apiClient.put<{ message: string; success: boolean }>(
        `/api/roles/${roleId}/permissions`,
        permissionIds
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      void queryClient.invalidateQueries({ queryKey: ['permissions-list'] });
      if (!variables.silent) {
        toast.success(`อัปเดตสิทธิ์สำหรับบทบาท (Role ID ${variables.roleId}) เรียบร้อยแล้ว`);
      }
    },
    onError: (err: unknown, variables) => {
      if (variables.silent) return;
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์ของ Role';
      toast.error(msg);
    },
  });
}
