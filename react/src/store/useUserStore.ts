import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cookieDelete } from "@/core/cookies";
import {
  clearStorageExcept,
  clearStorageWhiteList,
} from "@/utils/localStorage";
import { useTokenStore } from "./useTokenStore";

interface UserState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  setUser: (user: UserResponse | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      logout: () => {
        cookieDelete("token");
        useTokenStore.getState().setToken(null);
        clearStorageExcept(clearStorageWhiteList);
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: "user-storage" },
  ),
);
