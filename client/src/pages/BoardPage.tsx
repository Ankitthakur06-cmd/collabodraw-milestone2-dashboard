import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/common/Layout";
import Toolbar from "../components/toolbar/Toolbar";
import Whiteboard from "../components/canvas/Whiteboard";
import { useBoardsStore } from "../store/boardsStore";
import { useBoardStore } from "../store/boardStore";
import type { Board } from "../types";

// Local Canvas milestone (Phase 3): opens /board/:shareId, fetches the
// board's metadata (title/shareId), and renders a fully local canvas —
// no networking beyond the one-time metadata fetch, no Socket.IO, no
// shape persistence. Shapes live only in boardStore for this milestone.

export default function BoardPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();

  // Reusing boardsStore's existing joinBoard action (already built for
  // the Dashboard's Join flow) instead of duplicating the same API call
  // here — same REST call, same "add to my boards list" side effect.
  const joinBoard = useBoardsStore((s) => s.joinBoard);

  const resetCanvas = useBoardStore((s) => s.resetCanvas);
  const selectedShapeId = useBoardStore((s) => s.selectedShapeId);
  const deleteShape = useBoardStore((s) => s.deleteShape);
  const selectShape = useBoardStore((s) => s.selectShape);
  const undo = useBoardStore((s) => s.undo);

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch board metadata and reset any previous board's local shapes,
  // whenever shareId changes (e.g. navigating between two boards).
  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;

    resetCanvas();
    setLoading(true);
    setError(null);

    joinBoard(shareId).then((result) => {
      if (cancelled) return;
      if (result) {
        setBoard(result);
      } else {
        setError("This board doesn't exist or you don't have access to it.");
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  // Delete / Escape / Ctrl+Z, ignored while typing in an input (e.g.
  // the stroke-width slider or a future text field).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isTyping) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        deleteShape(selectedShapeId);
      } else if (e.key === "Escape") {
        selectShape(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, deleteShape, selectShape, undo]);

  if (loading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
      </Layout>
    );
  }

  if (error || !board) {
    return (
      <Layout>
        <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">{error ?? "Board not found."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-3 text-sm font-medium text-red-700 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{board.title}</h1>
          <p className="text-xs text-slate-400">Share ID: {board.shareId}</p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mt-4">
        <Toolbar />
      </div>

      <div className="mt-4">
        <Whiteboard />
      </div>
    </Layout>
  );
}
