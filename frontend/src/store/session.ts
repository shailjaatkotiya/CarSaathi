import { create } from "zustand";
import { persist } from "zustand/middleware";

type SessionState = {
  token: string | null;
  setToken: (token: string | null) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token })
    }),
    { name: "ridesaathi-session" }
  )
);
