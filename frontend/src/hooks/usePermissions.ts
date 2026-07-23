'use client';

import { useAuthStore } from '@/store/useAuthStore';

/**
 * Custom Hook for evaluating fine-grained RBAC permissions in React Components.
 * Nature MiniPlex Architecture Standard:
 * - Checks Action:Resource or Permission Code against the Zustand Auth Store.
 * - Backend remains Single Source of Truth (SSOT).
 */
export function usePermissions() {
  const { permissions, role, token, isHydrated, hasPermission: storeHasPermission, can: storeCan } = useAuthStore();
  const isAuthenticated = Boolean(token);

  /**
   * Check if user possesses a specific permission code (e.g. "bookings:cancel:own")
   */
  const hasPermission = (permissionCode: string): boolean => {
    if (!isAuthenticated) return false;
    return storeHasPermission(permissionCode);
  };

  /**
   * Check if user is allowed to perform an Action on a Resource (e.g. action="Cancel", resource="Bookings")
   */
  const can = (action: string, resource: string): boolean => {
    if (!isAuthenticated) return false;
    return storeCan(action, resource);
  };

  /**
   * Check if user has ANY of the specified permission codes
   */
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (!isAuthenticated || !permissionCodes.length) return false;
    return permissionCodes.some((code) => hasPermission(code));
  };

  /**
   * Check if user has ALL of the specified permission codes
   */
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    if (!isAuthenticated || !permissionCodes.length) return false;
    return permissionCodes.every((code) => hasPermission(code));
  };

  return {
    permissions,
    role,
    isAuthenticated,
    isHydrated,
    hasPermission,
    can,
    hasAnyPermission,
    hasAllPermissions,
  };
}
