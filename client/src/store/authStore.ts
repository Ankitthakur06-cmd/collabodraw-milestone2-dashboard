import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import type { User, LoginPayload, RegisterPayload } from "../types";
import { extractErrorMessage, loginUser, registerUser } from "../api/apiClient";

// Auth state, persisted to localStorage so a refresh doesn't log the
// user out. Login/register centralize their own API call + error toast
// so pages just call the action and react to the boolean result.

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  // True once zustand's persist middleware has finished reading
  // localStorage on startup. Consumed by ProtectedRoute so it doesn't
  // redirect a logged-in user to /login before hydration completes.
  hasHydrated: boolean;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => void;
  hydrateAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      hasHydrated: false,

      login: async (payload) => {
        set({ loading: true });
        try {
          const data = await loginUser(payload);
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          toast.success("Welcome back!");
          return true;
        } catch (err) {
          set({ loading: false });
          toast.error(extractErrorMessage(err, "Login failed. Please try again."));
          return false;
        }
      },

      register: async (payload) => {
        set({ loading: true });
        try {
          const data = await registerUser(payload);
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          toast.success("Account created!");
          return true;
        } catch (err) {
          set({ loading: false });
          toast.error(extractErrorMessage(err, "Registration failed. Please try again."));
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      hydrateAuth: () => set({ hasHydrated: true }),
    }),
    {
      name: "collabodraw-auth",
      // Never persist `loading`/`hasHydrated` — stale values would
      // strand the UI in the wrong state after a refresh.
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Runs automatically once persist finishes loading localStorage
      // at app startup — this is what actually calls hydrateAuth().
      onRehydrateStorage: () => (state) => {
        state?.hydrateAuth();
      },
    }
  )
);
