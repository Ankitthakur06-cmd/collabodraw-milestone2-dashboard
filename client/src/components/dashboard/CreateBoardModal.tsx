import { useEffect, useState } from "react";
import type { FormEvent } from "react";

// Plain conditional-rendered overlay — no dialog library needed for a
// single-field form. Resets its own fields whenever `isOpen` goes
// false, regardless of whether that was Cancel or a successful create.

interface CreateBoardModalProps {
  isOpen: boolean;
  submitting: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export default function CreateBoardModal({
  isOpen,
  submitting,
  onClose,
  onCreate,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Board title is required");
      return;
    }
    setError("");
    onCreate(title.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">New board</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Board title"
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
              {submitting ? "Creating…" : "Create board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
