import { create } from 'zustand';
import { type UserDef } from '@/schemas/user.schema';

interface UsersState {
  users: UserDef[];
  isLoaded: boolean;
  setUsers: (users: UserDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoaded: false,
  setUsers: (users) => set({ users, isLoaded: true }),
  setLoaded: (val) => set({ isLoaded: val }),
}));
