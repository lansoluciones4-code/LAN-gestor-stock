import { create } from 'zustand';
import { type ProductDef } from '@/schemas/product.schema';

interface ProductsState {
  products: ProductDef[];
  isLoaded: boolean;
  setProducts: (items: ProductDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  isLoaded: false,
  setProducts: (items: ProductDef[]) => set({ products: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
