// Socket.IO — networking foundation only (Milestone 5).
// Rooms are keyed by board shareId. Only room management (join/leave +
// presence-of-connection events) lives here. draw:* / cursor:* /
// shape:undo / shape:redo etc. are still deferred to Phase 4/5/6 per the
// finalized architecture (Section 6) — no drawing/cursor/sync events yet.

export function initSockets(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Which board room this socket currently occupies, if any. A socket
    // is only ever in at most one board room at a time for this milestone.
    socket.data.boardId = null;

    socket.on("join-board", (boardId) => {
      if (!boardId || typeof boardId !== "string") return;

      // If already in a different room, leave it first so a socket can
      // never be "present" in two boards at once (no drawing/sync
      // implications yet — this is purely room bookkeeping).
      if (socket.data.boardId && socket.data.boardId !== boardId) {
        const previousBoardId = socket.data.boardId;
        socket.leave(previousBoardId);
        socket.to(previousBoardId).emit("user-left", { socketId: socket.id });
        console.log(`Socket ${socket.id} left board room: ${previousBoardId}`);
      }

      socket.join(boardId);
      socket.data.boardId = boardId;
      console.log(`Socket ${socket.id} joined board room: ${boardId}`);

      // Ack back to the joining socket only.
      socket.emit("joined-board", { boardId, socketId: socket.id });

      // Notify everyone else already in the room.
      socket.to(boardId).emit("user-joined", { socketId: socket.id });
    });

    socket.on("leave-board", (boardId) => {
      const targetBoardId = boardId || socket.data.boardId;
      if (!targetBoardId) return;

      socket.leave(targetBoardId);
      console.log(`Socket ${socket.id} left board room: ${targetBoardId}`);

      socket.to(targetBoardId).emit("user-left", { socketId: socket.id });

      if (socket.data.boardId === targetBoardId) {
        socket.data.boardId = null;
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);

      // If the socket was still sitting in a board room when it
      // disconnected, let the rest of that room know it's gone.
      if (socket.data.boardId) {
        socket.to(socket.data.boardId).emit("user-left", { socketId: socket.id });
      }
    });
  });
}

export default initSockets;
