import { useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { navConfig, NavGroupConfig } from '@/config/navConfig';

/**
 * Custom Hook: useFilteredNavItems
 * Filters navConfig based on current user Zustand permissions.
 * Fully hides inaccessible routes from the DOM.
 */
export function useFilteredNavItems(): { filteredNavGroups: NavGroupConfig[]; isHydrated: boolean } {
  const { hasPermission, isHydrated } = usePermissions();

  const filteredNavGroups = useMemo(() => {
    if (!isHydrated) return [];

    return navConfig
      .map((group) => {
        const allowedItems = group.items.filter((item) => {
          if (!item.permissions || item.permissions.length === 0) return true;
          return item.permissions.some((perm) => hasPermission(perm));
        });

        return {
          ...group,
          items: allowedItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [hasPermission, isHydrated]);

  return { filteredNavGroups, isHydrated };
}
