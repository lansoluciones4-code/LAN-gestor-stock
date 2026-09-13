import { create } from 'zustand';
import { type SparePartDef } from '@/features/spare-part/domain/spare-part.schema';

interface SparePartState {
  spareParts: SparePartDef[];
  isLoaded: boolean;
  setSpareParts: (items: SparePartDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useSparePartStore = create<SparePartState>((set) => ({
  spareParts: [],
  isLoaded: false,
  setSpareParts: (items: SparePartDef[]) => set({ spareParts: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
