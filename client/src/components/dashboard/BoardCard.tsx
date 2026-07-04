import toast from "react-hot-toast";
import type { Board } from "../../types";

// Dumb/presentational — owns only clipboard-copy + the delete
// confirmation prompt (pure UI concerns), not data fetching or
// business logic. Actual deletion happens via the onDelete callback,
// which the parent wires to boardsStore.

interface BoardCardProps {
  board: Board;
  isOwner: boolean;
  onOpen: (shareId: string) => void;
  onDelete: (id: string) => void;
}

export default function BoardCard({ board, isOwner, onOpen, onDelete }: BoardCardProps) {
  function handleCopyLink() {
    const link = `${window.location.origin}/board/${board.shareId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Couldn't copy the link"));
  }

  function handleDeleteClick() {
    if (window.confirm(`Delete "${board.title}"? This can't be undone.`)) {
      onDelete(board.id);
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-slate-900">{board.title}</span>
          {isOwner && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Owner
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Created {new Date(board.createdAt).toLocaleDateString()}
        </p>
        <p className="mt-1 truncate text-xs text-slate-400" title={board.shareId}>
          ID: {board.shareId}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onOpen(board.shareId)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          Open
        </button>
        <button
          onClick={handleCopyLink}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Copy Link
        </button>
        {isOwner && (
          <button
            onClick={handleDeleteClick}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
