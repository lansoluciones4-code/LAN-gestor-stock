import { create } from 'zustand';
import type { ExpensesDashboardData } from '@/features/expense/domain/expense-dashboard.types';

interface ExpenseState {
  data: ExpensesDashboardData | null;
  isLoaded: boolean;
  setData: (data: ExpensesDashboardData) => void;
  setLoaded: (val: boolean) => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  data: null,
  isLoaded: false,
  setData: (data: ExpensesDashboardData) => set({ data, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
