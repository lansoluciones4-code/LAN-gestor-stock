import { create } from 'zustand';

interface StatsState {
  stats: any | null;
  isLoaded: boolean;
  setStats: (stats: any) => void;
  setLoaded: (val: boolean) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  isLoaded: false,
  setStats: (stats) => set({ stats, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
