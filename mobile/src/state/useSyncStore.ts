import { create } from 'zustand';
import { LocalUser } from '../types/user';
import { syncStudentData, pullOnly, SyncResult } from '../services/syncService';
import { getLastSyncTime } from '../db/repositories/syncRepo';
import { countByStatus } from '../db/repositories/submissionRepo';

interface SyncState {
  syncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  lastResult: SyncResult | null;
  error: string | null;
  refreshStatus: () => Promise<void>;
  fullSync: (user: LocalUser, classroomId?: string) => Promise<SyncResult>;
  pull: (user: LocalUser, classroomId?: string) => Promise<SyncResult>;
}

export const useSyncStore = create<SyncState>((set) => ({
  syncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  lastResult: null,
  error: null,

  refreshStatus: async () => {
    const [lastSyncAt, pendingCount] = await Promise.all([
      getLastSyncTime(),
      countByStatus(['completed_unsynced', 'sync_failed']),
    ]);
    set({ lastSyncAt, pendingCount });
  },

  fullSync: async (user, classroomId) => {
    set({ syncing: true, error: null });
    try {
      const result = await syncStudentData(user, classroomId);
      set({ syncing: false, lastResult: result, lastSyncAt: result.serverTime });
      await useSyncStore.getState().refreshStatus();
      return result;
    } catch (err) {
      set({ syncing: false, error: (err as Error).message });
      await useSyncStore.getState().refreshStatus();
      throw err;
    }
  },

  pull: async (user, classroomId) => {
    set({ syncing: true, error: null });
    try {
      const result = await pullOnly(user, classroomId);
      set({ syncing: false, lastResult: result, lastSyncAt: result.serverTime });
      return result;
    } catch (err) {
      set({ syncing: false, error: (err as Error).message });
      throw err;
    }
  },
}));
