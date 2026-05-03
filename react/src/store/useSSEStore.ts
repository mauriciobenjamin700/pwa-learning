import { create } from "zustand";

export interface SSEMessage {
  message_id: string;
  type: string;
  payload: unknown;
  receivedAt: number;
}

interface SSEState {
  messages: SSEMessage[];
  addMessage: (msg: SSEMessage) => void;
  clearAll: () => void;
}

const MAX_MESSAGES = 100;

export const useSSEStore = create<SSEState>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages.slice(-(MAX_MESSAGES - 1)), msg],
    })),
  clearAll: () => set({ messages: [] }),
}));
