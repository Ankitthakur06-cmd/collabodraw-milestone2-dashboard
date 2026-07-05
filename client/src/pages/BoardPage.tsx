import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/common/Layout";
import Toolbar from "../components/toolbar/Toolbar";
import Whiteboard from "../components/canvas/Whiteboard";
import ConnectionIndicator from "../components/presence/ConnectionIndicator";
import { useBoardsStore } from "../store/boardsStore";
import { useBoardStore } from "../store/boardStore";
import { usePresenceStore } from "../store/presenceStore";
import { getBoardCanvas, saveBoardCanvas } from "../api/apiClient";
import socket, { connect, disconnect, joinRoom, leaveRoom } from "../socket/socketClient";
import type { Board, CanvasShape } from "../types";

// Local Canvas milestone (Phase 3): opens /board/:shareId, fetches the
// board's metadata (title/shareId), and renders a fully local canvas —
// no shape persistence, no drawing sync. Shapes live only in boardStore.
//
// Milestone 5 adds just the Socket.IO room lifecycle (connect + join on
// mount, leave + maybe-disconnect on unmount) and a bare connection
// indicator — no drawing/cursor/shape events ride on the socket yet.

// Shared across every mounted BoardPage instance (module scope = one
// instance per module, regardless of how many components render), so
// the socket is only disconnected once nothing is using it — e.g. two
// BoardPage instances briefly overlapping during a React Router
// transition, or React StrictMode's mount/unmount/mount in dev.
let activeBoardPageInstances = 0;

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
  const applyRemoteShapeAdded = useBoardStore((s) => s.applyRemoteShapeAdded);
  const applyRemoteShapeUpdated = useBoardStore((s) => s.applyRemoteShapeUpdated);
  const applyRemoteShapeDeleted = useBoardStore((s) => s.applyRemoteShapeDeleted);
  const applyRemoteCanvasCleared = useBoardStore((s) => s.applyRemoteCanvasCleared);
  const loadShapes = useBoardStore((s) => s.loadShapes);

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

    joinBoard(shareId).then(async (result) => {
      if (cancelled) return;
      if (!result) {
        setError("This board doesn't exist or you don't have access to it.");
        setLoading(false);
        return;
      }

      setBoard(result);

      // Persistence (Milestone 7): populate the canvas with whatever
      // was last saved for this board. Non-fatal if it fails — the
      // board metadata already loaded fine, so the canvas just starts
      // empty rather than blocking the whole page on a transient error.
      try {
        const shapes = await getBoardCanvas(shareId);
        if (!cancelled) {
          loadShapes(shapes);
        }
      } catch {
        // Swallow — see comment above.
      }

      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  // Socket.IO room lifecycle (Milestone 5): connect + join this board's
  // room on mount, listen for connection/room events to update
  // presenceStore, then leave the room (and disconnect only if no other
  // BoardPage instance still needs the socket) on unmount. Kept in its
  // own effect, separate from the REST metadata fetch above.
  useEffect(() => {
    if (!shareId) return;

    activeBoardPageInstances += 1;

    const handleConnect = () => {
      usePresenceStore.getState().setConnected();
      usePresenceStore.getState().setSocketId(socket.id ?? null);
      // Socket.IO issues a new socket.id on every reconnect, and the
      // server has no memory of the old socket's room membership — so
      // the room must be explicitly re-joined here, not just on mount.
      joinRoom(shareId);
    };

    const handleDisconnect = () => {
      usePresenceStore.getState().setDisconnected();
      usePresenceStore.getState().setSocketId(null);
      usePresenceStore.getState().clearUsers();
      usePresenceStore.getState().clearCursors();
    };

    const handleJoinedBoard = (payload: { boardId: string; socketId: string }) => {
      usePresenceStore.getState().setSocketId(payload.socketId);
    };

    const handleUserJoined = (payload: { socketId: string }) => {
      usePresenceStore.getState().addUser(payload.socketId);
    };

    const handleUserLeft = (payload: { socketId: string }) => {
      usePresenceStore.getState().removeUser(payload.socketId);
      usePresenceStore.getState().removeCursor(payload.socketId);
    };

    // Remote committed-shape events (Milestone 6, Step 4). These call
    // only the boardStore's remote-apply actions — never the local
    // ones — so a remote peer's action is never pushed onto this tab's
    // own undo history, and nothing here ever emits back out.
    const handleShapeAdded = (shape: CanvasShape) => {
      applyRemoteShapeAdded(shape);
    };

    const handleShapeUpdated = (payload: { id: string } & Partial<CanvasShape>) => {
      const { id, ...changes } = payload;
      applyRemoteShapeUpdated(id, changes);
    };

    const handleShapeDeleted = (payload: { id: string }) => {
      applyRemoteShapeDeleted(payload.id);
    };

    const handleCanvasCleared = () => {
      applyRemoteCanvasCleared();
    };

    // Live cursor relay (Milestone 8): server tags every relayed cursor
    // with the sender's socketId. No username is available at the
    // socket layer (sockets aren't authenticated — a deliberate
    // Milestone 5 decision), so fall back to the socketId itself as
    // the display name when one isn't supplied.
    const handleCursorUpdate = (payload: { socketId: string; x: number; y: number; name?: string }) => {
      usePresenceStore.getState().setCursor(payload.socketId, payload.x, payload.y, payload.name ?? payload.socketId);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("joined-board", handleJoinedBoard);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("shape-added", handleShapeAdded);
    socket.on("shape-updated", handleShapeUpdated);
    socket.on("shape-deleted", handleShapeDeleted);
    socket.on("canvas-cleared", handleCanvasCleared);
    socket.on("cursor-update", handleCursorUpdate);

    connect();

    // If the socket was already connected before this effect ran (e.g.
    // navigating from one board straight to another), the "connect"
    // event won't fire again — sync presenceStore and (re)join the
    // room immediately instead. Otherwise, handleConnect's own
    // joinRoom(shareId) call (above) covers the join once "connect"
    // fires — calling joinRoom() a second time here would double-send
    // join-board on every connect.
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      leaveRoom(shareId);

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("joined-board", handleJoinedBoard);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("shape-added", handleShapeAdded);
      socket.off("shape-updated", handleShapeUpdated);
      socket.off("shape-deleted", handleShapeDeleted);
      socket.off("canvas-cleared", handleCanvasCleared);
      socket.off("cursor-update", handleCursorUpdate);

      usePresenceStore.getState().clearUsers();

      activeBoardPageInstances -= 1;
      if (activeBoardPageInstances <= 0) {
        disconnect();
      }
    };
  }, [
    shareId,
    applyRemoteShapeAdded,
    applyRemoteShapeUpdated,
    applyRemoteShapeDeleted,
    applyRemoteCanvasCleared,
  ]);

  // Delete / Escape / Ctrl+Z, ignored while typing in an input (e.g.
  // the stroke-width slider or a future text field).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isTyping) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
        deleteShape(selectedShapeId);
        // Emit only after the local delete succeeds. Undo (below) is
        // intentionally local-only for this milestone — no emit there.
        socket.emit("shape-deleted", { id: selectedShapeId });
        // Persist (Milestone 7): save the latest full shapes snapshot
        // after the action has completed — not during, not for undo.
        if (shareId) {
          saveBoardCanvas(shareId, useBoardStore.getState().shapes).catch(() => {
            // Non-fatal — sync already happened via socket; a failed
            // save just means this change won't survive a refresh.
          });
        }
      } else if (e.key === "Escape") {
        selectShape(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShapeId, deleteShape, selectShape, undo, shareId]);

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
        <div className="flex items-center gap-4">
          <ConnectionIndicator />
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to Dashboard
          </button>
        </div>
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
