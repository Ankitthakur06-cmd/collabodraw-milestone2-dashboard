// Socket.IO — networking foundation (Milestone 5) + committed-shape
// relay (Milestone 6) + live cursor relay (Milestone 8). Rooms are
// keyed by board shareId. Milestone 6 adds pure relay events for
// already-committed canvas changes (shape-added / shape-updated /
// shape-deleted / canvas-cleared) — the server does no validation or
// persistence of shape data, it just forwards the payload to the rest
// of the room, same pattern as the existing user-joined/user-left
// events. Milestone 8 adds the same pass-through treatment for live
// cursor position — no storage, no persistence, in-memory relay only.

const RELAY_EVENTS = ["shape-added", "shape-updated", "shape-deleted", "canvas-cleared"];

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

    // Committed-shape relay: shape-added / shape-updated / shape-deleted /
    // canvas-cleared. Each is a pure pass-through broadcast to the rest
    // of the sender's current room — no shape validation, no DB write,
    // no undo handling. The sender is excluded (socket.to, not io.to) so
    // it doesn't get an echo of its own action.
    for (const eventName of RELAY_EVENTS) {
      socket.on(eventName, (payload) => {
        if (!socket.data.boardId) return;
        socket.to(socket.data.boardId).emit(eventName, payload);
      });
    }

    // Live cursor relay (Milestone 8): client emits "cursor-move" with
    // its own position; server relays it as "cursor-update" to the rest
    // of the sender's current room, tagging on socketId so recipients
    // know whose cursor it is. Nothing is stored — this is an in-memory,
    // fire-and-forget pass-through, same as the shape relay above, just
    // under a different event name in vs. out.
    socket.on("cursor-move", (payload) => {
      if (!socket.data.boardId) return;
      socket.to(socket.data.boardId).emit("cursor-update", { ...payload, socketId: socket.id });
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
