import { create } from 'zustand';
import { type ProviderDef } from '@/schemas/provider.schema';

interface ProvidersState {
  providers: ProviderDef[];
  isLoaded: boolean;
  setProviders: (items: ProviderDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useProvidersStore = create<ProvidersState>((set) => ({
  providers: [],
  isLoaded: false,
  setProviders: (items: ProviderDef[]) => set({ providers: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
