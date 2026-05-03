import { create } from "zustand";
import { cookieGet } from "@/core/cookies";

interface TokenState {
  token: string | null;
  setToken: (token: string | null) => void;
  loadToken: () => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  loadToken: () => set({ token: cookieGet("token") ?? null }),
}));
