// Socket.IO initialization only — no events registered yet.
// board:join / draw:* / cursor:* / shape:undo / shape:redo etc.
// are all implemented in Phase 4 (Real-Time Sync) and Phase 5/6
// per the finalized architecture (Section 6).

export function initSockets(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export default initSockets;
