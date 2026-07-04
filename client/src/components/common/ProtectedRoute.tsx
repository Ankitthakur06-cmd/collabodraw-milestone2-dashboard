import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// Guards routes that require authentication (Dashboard, Board).
// Unauthenticated users are redirected to /login.

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  // Wait for the persisted auth state to load before deciding whether to
  // redirect — otherwise a logged-in user briefly flashes to /login on
  // every refresh while localStorage is still being read.
  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
