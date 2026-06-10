import { create } from "zustand";
import { persist } from "zustand/middleware";

type SessionState = {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null })
    }),
    { name: "ridesaathi-session" }
  )
);
