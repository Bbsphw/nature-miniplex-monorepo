import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { AuthResponse, UserRole } from '@/types/api';

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  permissions: string[];
  isHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setAuth: (auth: AuthResponse) => void;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permissionCode: string) => boolean;
  can: (action: string, resource: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      role: null,
      permissions: [],
      isHydrated: false,

      setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),

      setAuth: (auth: AuthResponse) => {
        Cookies.set('admin_token', auth.accessToken, { expires: 1, path: '/' });
        
        let defaultPermissions: string[] = auth.permissions || [];
        if (!defaultPermissions.length && auth.role) {
          if (auth.role === 'SYSTEM_ADMIN') {
            defaultPermissions = [
              'bookings:read:all',
              'bookings:cancel:any',
              'showtime:create',
              'users:manage',
              'roles:manage'
            ];
          } else if (auth.role === 'CINEMA_MANAGER') {
            defaultPermissions = [
              'bookings:read:assigned_cinema',
              'bookings:cancel:assigned_cinema',
              'showtime:create'
            ];
          } else if (auth.role === 'COUNTER_STAFF') {
            defaultPermissions = [
              'bookings:read:assigned_cinema'
            ];
          }
        }

        set({
          token: auth.accessToken,
          username: auth.username,
          role: auth.role,
          permissions: defaultPermissions,
        });
      },

      setPermissions: (permissions: string[]) => {
        set({ permissions });
      },

      hasPermission: (permissionCode: string) => {
        const { permissions, role } = get();
        if (role === 'SYSTEM_ADMIN' || permissions.includes('*')) {
          return true;
        }
        return permissions.includes(permissionCode);
      },

      can: (action: string, resource: string) => {
        const { permissions, role } = get();
        if (role === 'SYSTEM_ADMIN' || permissions.includes('*')) {
          return true;
        }
        const targetAction = action.toLowerCase();
        const targetResource = resource.toLowerCase();

        return permissions.some((code) => {
          const lowerCode = code.toLowerCase();
          return lowerCode.includes(targetResource) && lowerCode.includes(targetAction);
        });
      },

      logout: () => {
        Cookies.remove('admin_token', { path: '/' });
        set({ token: null, username: null, role: null, permissions: [], isHydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
