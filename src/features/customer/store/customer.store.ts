import { create } from 'zustand';
import { type CustomerDef } from '@/features/customer/domain/customer.schema';

interface CustomersState {
  customers: CustomerDef[];
  isLoaded: boolean;
  setCustomers: (items: CustomerDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useCustomerStore = create<CustomersState>((set) => ({
  customers: [],
  isLoaded: false,
  setCustomers: (items: CustomerDef[]) => set({ customers: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
