import { create } from 'zustand';
import { type ProductReturnDef } from '@/features/product-return/domain/product-return.schema';

interface ProductReturnsState {
  returns: ProductReturnDef[];
  isLoaded: boolean;
  setReturns: (items: ProductReturnDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useProductReturnStore = create<ProductReturnsState>((set) => ({
  returns: [],
  isLoaded: false,
  setReturns: (items: ProductReturnDef[]) => set({ returns: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
