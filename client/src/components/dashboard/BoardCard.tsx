import type { Board } from "../../types";

// Dumb/presentational — takes a board and a click handler, does not
// fetch or own any state itself.

interface BoardCardProps {
  board: Board;
  onOpen: (shareId: string) => void;
}

export default function BoardCard({ board, onOpen }: BoardCardProps) {
  return (
    <button
      onClick={() => onOpen(board.shareId)}
      className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <span className="font-medium text-slate-900">{board.title}</span>
      <span className="mt-1 text-xs text-slate-500">
        Created {new Date(board.createdAt).toLocaleDateString()}
      </span>
    </button>
  );
}
