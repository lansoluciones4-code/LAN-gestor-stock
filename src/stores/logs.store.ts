import { create } from 'zustand';

interface LogsState {
  isLoaded: boolean;
  setLoaded: (val: boolean) => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  isLoaded: false,
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
