import { create } from 'zustand';
import { type AuditLogDef } from '@/features/audit/domain/audit-log.schema';

interface LogsState {
  logs: AuditLogDef[];
  isLoaded: boolean;
  setLogs: (logs: AuditLogDef[]) => void;
  appendLogs: (logs: AuditLogDef[]) => void;
  setLoaded: (val: boolean) => void;
}

export const useAuditStore = create<LogsState>((set) => ({
  logs: [],
  isLoaded: false,
  setLogs: (logs: AuditLogDef[]) => set({ logs, isLoaded: true }),
  appendLogs: (newLogs: AuditLogDef[]) => set((state) => ({ logs: [...state.logs, ...newLogs] })),
  setLoaded: (val: boolean) => set({ isLoaded: val }),
}));
