import { create } from 'zustand';
import { type UserDef } from '@/features/user/domain/user.schema';

interface UsersState {
  users: UserDef[];
  isLoaded: boolean;
  setUsers: (users: UserDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useUserStore = create<UsersState>((set) => ({
  users: [],
  isLoaded: false,
  setUsers: (users) => set({ users, isLoaded: true }),
  setLoaded: (val) => set({ isLoaded: val }),
}));
