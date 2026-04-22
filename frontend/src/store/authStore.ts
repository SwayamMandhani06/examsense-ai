import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";
import { clearAuth } from "@/lib/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        clearAuth();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (partial) => {
        set((state) => {
          if (!state.user) return state;
          const keys = Object.keys(partial) as Array<keyof User>;
          const changed = keys.some((key) => state.user?.[key] !== partial[key]);
          if (!changed) return state;
          return { user: { ...state.user, ...partial } };
        });
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "examsense-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
