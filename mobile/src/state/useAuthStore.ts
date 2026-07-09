import { create } from 'zustand';
import { LocalUser, UserRole } from '../types/user';
import { currentUser, register, login, logout, setHubUrl, setName, registerWithHub } from '../services/authService';

interface AuthState {
  user: LocalUser | null;
  loading: boolean;
  init: () => Promise<void>;
  register: (email: string, password: string, role: UserRole, name: string, hubUrl?: string) => Promise<LocalUser>;
  login: (email: string, password: string, hubUrl?: string) => Promise<LocalUser>;
  logout: () => Promise<void>;
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

  register: async (email, password, role, name, hubUrl) => {
    const user = await register(email, password, role, name, hubUrl);
    set({ user });
    return user;
  },

  login: async (email, password, hubUrl) => {
    const user = await login(email, password, hubUrl);
    set({ user });
    return user;
  },

  logout: async () => {
    await logout();
    set({ user: null });
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
