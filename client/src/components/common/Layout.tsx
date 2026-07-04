import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

// Minimal shared shell. Shows a logout control whenever a user is
// authenticated — this is the one place the logout flow (clear state
// + redirect) actually runs from.

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="font-semibold tracking-tight">CollaboDraw</span>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
