import { create } from 'zustand';
import { checkHub } from '../services/networkService';

interface HubState {
  online: boolean; // hub reachable (via /health)
  checking: boolean;
  detail: string;
  lastCheckedAt: number | null;
  check: (hubUrl: string | null) => Promise<boolean>;
  setOffline: () => void;
}

export const useHubStore = create<HubState>((set) => ({
  online: false,
  checking: false,
  detail: 'Not checked yet',
  lastCheckedAt: null,

  check: async (hubUrl) => {
    set({ checking: true });
    const result = await checkHub(hubUrl);
    set({
      online: result.ok,
      detail: result.detail,
      checking: false,
      lastCheckedAt: Date.now(),
    });
    return result.ok;
  },

  setOffline: () => set({ online: false, detail: 'Offline' }),
}));
