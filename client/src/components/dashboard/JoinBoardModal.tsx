import { useEffect, useState } from "react";
import type { FormEvent } from "react";

// Mirrors CreateBoardModal's structure/behavior (same reset-on-close
// pattern) — just a different field and verb.

interface JoinBoardModalProps {
  isOpen: boolean;
  submitting: boolean;
  onClose: () => void;
  onJoin: (shareId: string) => void;
}

export default function JoinBoardModal({ isOpen, submitting, onClose, onJoin }: JoinBoardModalProps) {
  const [shareId, setShareId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setShareId("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shareId.trim()) {
      setError("Share ID is required");
      return;
    }
    setError("");
    onJoin(shareId.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">Join a board</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <input
              autoFocus
              type="text"
              value={shareId}
              onChange={(e) => setShareId(e.target.value)}
              placeholder="Paste share ID"
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400 ${
                error ? "border-red-400" : "border-slate-300"
              }`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Joining…" : "Join board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
