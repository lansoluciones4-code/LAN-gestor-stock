import { create } from 'zustand';
import { type CustomerDef } from '@/schemas/customer.schema';

interface CustomersState {
  customers: CustomerDef[];
  isLoaded: boolean;
  setCustomers: (items: CustomerDef[]) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  isLoaded: false,
  setCustomers: (items: CustomerDef[]) => set({ customers: items, isLoaded: true }),
}));
