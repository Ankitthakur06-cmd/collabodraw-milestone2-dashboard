import { io, Socket } from "socket.io-client";

// Single shared Socket.IO client instance (singleton — never create a
// second one). Milestone 5 (Socket.IO Foundation): connect/disconnect +
// room join/leave helpers only. No drawing/cursor/shape events are wired
// up here — that's still deferred to Phase 4/5/6 per the finalized
// architecture.

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  // Reconnection uses Socket.IO's own defaults (reconnection: true,
  // unlimited attempts, expanding backoff) — no custom config needed.
  // TODO (Phase 4): pass JWT via `auth: { token }` for the
  // server-side io.use() handshake middleware.
});

// Dev-only connection/error logging. import.meta.env.DEV is true for
// `npm run dev` and false in a production build, so these listeners are
// silent (but still harmlessly attached) in prod.
if (import.meta.env.DEV) {
  socket.on("connect", () => {
    console.log(`[socket] connected: ${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[socket] disconnected: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error(`[socket] connection error: ${err.message}`);
  });
}

// Opens the connection if it isn't already open/opening. Safe to call
// repeatedly — Socket.IO no-ops a connect() call on an already-connected
// (or currently connecting) manager, but this guard keeps intent explicit
// and avoids relying on that internal behavior.
export function connect(): void {
  if (socket.connected) return;
  socket.connect();
}

// Closes the connection. Safe to call even if already disconnected.
export function disconnect(): void {
  if (!socket.connected) return;
  socket.disconnect();
}

// Joins a board's Socket.IO room. Mirrors the server's "join-board"
// handler (server/src/sockets/index.js) — server-side room switching
// (leaving any previous room) is handled there, not here.
export function joinRoom(boardId: string): void {
  if (!boardId) return;
  socket.emit("join-board", boardId);
}

// Leaves a board's Socket.IO room.
export function leaveRoom(boardId: string): void {
  if (!boardId) return;
  socket.emit("leave-board", boardId);
}

export default socket;
