import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSession } from '@/types';

// Zustand store interface representing auth state client-side
interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
  loginState: (user: UserSession) => void;
  logoutState: () => void;
}

/**
 * Zustand store utilized mostly by UI components
 * to determine role-based rendering (e.g. edit/delete buttons for admins).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // Setting authenticated state upon successful auth logic
      loginState: (user: UserSession) =>
        set({ user, isAuthenticated: true }),

      // Wiping client state gracefully
      logoutState: () =>
        set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // Stored in localStorage for persistent UI across refreshes.
    }
  )
);
