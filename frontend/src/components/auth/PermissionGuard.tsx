'use client';

import React, { ReactElement, useSyncExternalStore } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export interface PermissionGuardProps {
  permission?: string;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  action?: string;
  resource?: string;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable';
  children: React.ReactNode;
}

/**
 * PermissionGuard Component
 * Nature MiniPlex Enterprise Security Best Practice:
 * - Hides or disables UI elements based on Zustand fine-grained permissions.
 * - Handles client-side hydration smoothly without flashing false 403 fallbacks on F5 refresh.
 * - Reminder: Frontend UI hiding is UX enhancement only. Backend API SSOT enforces actual security!
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  action,
  resource,
  fallback = null,
  mode = 'hide',
  children,
}) => {
  const { hasPermission, can, isHydrated } = usePermissions();
  const mounted = useIsMounted();

  // During SSR or initial client mount frame before Zustand rehydrates, avoid layout break
  if (!mounted || !isHydrated) {
    if (fallback === null) return null;
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full p-8">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-prompt animate-pulse">
          <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          <span>กำลังตรวจสอบสิทธิ์การเข้าถึง (Verifying Permissions)...</span>
        </div>
      </div>
    );
  }

  let isAllowed = false;

  const targetPerm = permission || requiredPermission;

  if (requiredPermissions && requiredPermissions.length > 0) {
    if (requireAll) {
      isAllowed = requiredPermissions.every((p) => hasPermission(p));
    } else {
      isAllowed = requiredPermissions.some((p) => hasPermission(p));
    }
  } else if (targetPerm) {
    isAllowed = hasPermission(targetPerm);
  } else if (action && resource) {
    isAllowed = can(action, resource);
  } else {
    isAllowed = true;
  }


  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === 'disable') {
    if (React.isValidElement(children)) {
      const child = children as ReactElement<{ disabled?: boolean; className?: string; title?: string }>;
      return React.cloneElement(child, {
        disabled: true,
        className: `${child.props.className || ''} opacity-50 cursor-not-allowed pointer-events-none`.trim(),
        title: child.props.title || 'Access restricted: You lack permission for this action',
      });
    }
  }

  return <>{fallback}</>;
};

/**
 * Higher-Order Component (HOC) for protecting components or entire page views
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: string,
  FallbackComponent: React.ComponentType = () => (
    <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
      <h3 className="text-lg font-semibold text-red-400">403 Forbidden - Access Restricted</h3>
      <p className="text-sm text-zinc-400 mt-1">
        You do not have permission ({requiredPermission}) to view this resource.
      </p>
    </div>
  )
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission, isHydrated } = usePermissions();
    const mounted = useIsMounted();

    if (!mounted || !isHydrated) {
      return (
        <div className="flex items-center justify-center min-h-[200px] w-full p-6">
          <div className="w-5 h-5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!hasPermission(requiredPermission)) {
      return <FallbackComponent />;
    }

    return <Component {...props} />;
  };
}
