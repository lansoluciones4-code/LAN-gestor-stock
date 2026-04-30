import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSession } from '@/features/auth/domain/auth.schema';

interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  loginState: (user: UserSession) => void;
  logoutState: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      loginState: (user: UserSession) => set({ user, isAuthenticated: true }),

      logoutState: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // Stored in localStorage for persistent UI across refreshes.
    }
  )
);
