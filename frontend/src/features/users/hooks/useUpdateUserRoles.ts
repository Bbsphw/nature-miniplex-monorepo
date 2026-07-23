import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { toast } from '@/store/useToastStore';

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, roleIds }: { userId: number; roleIds: number[] }) => {
      const { data } = await apiClient.put<{ message: string; success: boolean }>(
        `/api/users/${userId}/roles`,
        roleIds
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['action-logs'] });
      toast.success(`อัปเดตบทบาทของพนักงาน (User ID ${variables.userId}) เรียบร้อยแล้ว`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตบทบาทของผู้ใช้';
      toast.error(msg);
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, email, cinemaId, isActive }: { userId: number; email?: string; cinemaId?: number; isActive?: boolean }) => {
      const { data } = await apiClient.put<{ message: string; success: boolean }>(
        `/api/users/${userId}`,
        { email, cinemaId, isActive }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['action-logs'] });
      toast.success(`อัปเดตข้อมูลพนักงาน (User ID ${variables.userId}) เรียบร้อยแล้ว`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลพนักงาน';
      toast.error(msg);
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const { data } = await apiClient.put<{ message: string; success: boolean }>(
        `/api/users/${userId}/status`,
        { isActive }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['action-logs'] });
      toast.success(`อัปเดตสถานะการใช้งานบัญชี (User ID ${variables.userId}) เป็น ${variables.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} เรียบร้อยแล้ว`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'เกิดข้อผิดพลาดในการปรับสถานะผู้ใช้';
      toast.error(msg);
    },
  });
}

