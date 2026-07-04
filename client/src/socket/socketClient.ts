import { io, Socket } from "socket.io-client";

// Single shared Socket.IO client instance.
// Connection is created but not auto-started, and no event
// listeners/emitters are wired up yet — that happens in
// Phase 4 (Real-Time Sync) per the finalized architecture.

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  // TODO (Phase 4): pass JWT via `auth: { token }` for the
  // server-side io.use() handshake middleware.
});

export default socket;
