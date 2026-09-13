import { create } from 'zustand';
import { type CounterDef } from '@/features/counter/domain/counter.schema';

interface CounterState {
  counters: CounterDef[];
  isLoaded: boolean;
  setCounters: (items: CounterDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  counters: [],
  isLoaded: false,
  setCounters: (items: CounterDef[]) => set({ counters: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
