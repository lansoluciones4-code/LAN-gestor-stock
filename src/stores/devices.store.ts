import { create } from 'zustand';
import { type DeviceDef } from '@/schemas/device.schema';

interface DevicesState {
  devices: DeviceDef[];
  isLoaded: boolean;
  setDevices: (items: DeviceDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useDevicesStore = create<DevicesState>((set) => ({
  devices: [],
  isLoaded: false,
  setDevices: (items: DeviceDef[]) => set({ devices: items, isLoaded: true }),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
