import { create } from 'zustand';
import { LocalUser, UserRole } from '../types/user';
import { currentUser, chooseRole, setHubUrl, setName, registerWithHub } from '../services/authService';

interface AuthState {
  user: LocalUser | null;
  loading: boolean;
  init: () => Promise<void>;
  selectRole: (role: UserRole, name?: string) => Promise<LocalUser>;
  updateHubUrl: (hubUrl: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  init: async () => {
    set({ loading: true });
    const user = await currentUser();
    set({ user, loading: false });
  },

  selectRole: async (role, name) => {
    const user = await chooseRole(role, name);
    set({ user });
    // Best-effort registration with the hub (ignored when offline / no url).
    registerWithHub(user).catch(() => undefined);
    return user;
  },

  updateHubUrl: async (hubUrl) => {
    await setHubUrl(hubUrl);
    const user = await currentUser();
    set({ user });
    if (user) registerWithHub(user).catch(() => undefined);
  },

  updateName: async (name) => {
    await setName(name);
    set({ user: await currentUser() });
  },

  refresh: async () => {
    set({ user: await currentUser() });
  },

  reset: () => set({ user: null }),
}));
