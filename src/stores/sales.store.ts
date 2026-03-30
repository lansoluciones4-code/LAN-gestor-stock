import { create } from 'zustand';
import { type SaleDef } from '@/schemas/sale.schema';

interface SalesState {
  sales: SaleDef[];
  isLoaded: boolean;
  setSales: (items: SaleDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useSalesStore = create<SalesState>((set) => ({
  sales: [],
  isLoaded: false,
  setSales: (items: SaleDef[]) => set({ sales: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
