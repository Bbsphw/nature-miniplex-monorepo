import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { AuthResponse, UserRole } from '@/types/api';

interface AuthState {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      role: null,
      setAuth: (auth: AuthResponse) => {
        Cookies.set('admin_token', auth.accessToken, { expires: 1, path: '/' });
        set({ token: auth.accessToken, username: auth.username, role: auth.role });
      },
      logout: () => {
        Cookies.remove('admin_token', { path: '/' });
        set({ token: null, username: null, role: null });
      },
    }),
    { name: 'auth-storage' }
  )
);
