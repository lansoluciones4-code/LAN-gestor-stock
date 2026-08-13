import { create } from 'zustand';
import { type TechnicalServiceDef } from '@/features/technical-service/domain/technical-service.schema';

interface TechnicalServicesState {
  technicalServices: TechnicalServiceDef[];
  isLoaded: boolean;
  setTechnicalServices: (items: TechnicalServiceDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useTechnicalServiceStore = create<TechnicalServicesState>((set) => ({
  technicalServices: [],
  isLoaded: false,
  setTechnicalServices: (items: TechnicalServiceDef[]) => set({ technicalServices: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
