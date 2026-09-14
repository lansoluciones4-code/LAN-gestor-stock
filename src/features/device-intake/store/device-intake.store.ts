import { create } from 'zustand';
import { type DeviceIntakeDef } from '@/features/device-intake/domain/device-intake.schema';

interface DeviceIntakeState {
  deviceIntakes: DeviceIntakeDef[];
  isLoaded: boolean;
  setDeviceIntakes: (items: DeviceIntakeDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useDeviceIntakeStore = create<DeviceIntakeState>((set) => ({
  deviceIntakes: [],
  isLoaded: false,
  setDeviceIntakes: (items: DeviceIntakeDef[]) => set({ deviceIntakes: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
