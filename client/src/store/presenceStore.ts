import { create } from "zustand";

// Connected users + live cursor positions placeholder, PLUS
// (Milestone 5) basic socket-connection/room-presence state.
//
// connectedUsers/cursors are untouched placeholders for a later phase
// (per-user identity + live cursor positions, Phase 6) — do not remove.
//
// connected/socketId/usersInRoom are this milestone's addition: just
// "is the socket up" and "which raw socket ids are in the current board
// room" — no user identity, no cursor data. Kept isolated from
// boardStore so this doesn't re-render the shape layer.

interface CursorInfo {
  x: number;
  y: number;
  name: string;
}

interface PresenceState {
  // --- existing placeholders (Phase 6), left as-is ---
  connectedUsers: Map<string, string>; // userId -> name
  cursors: Map<string, CursorInfo>;

  // --- Milestone 5: connection + room presence ---
  connected: boolean;
  socketId: string | null;
  usersInRoom: string[]; // raw socket ids currently in the joined board room

  setConnected: () => void;
  setDisconnected: () => void;
  setSocketId: (socketId: string | null) => void;
  addUser: (socketId: string) => void;
  removeUser: (socketId: string) => void;
  clearUsers: () => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  connectedUsers: new Map(),
  cursors: new Map(),

  connected: false,
  socketId: null,
  usersInRoom: [],

  setConnected: () => set({ connected: true }),
  setDisconnected: () => set({ connected: false }),
  setSocketId: (socketId) => set({ socketId }),

  addUser: (socketId) =>
    set((state) =>
      state.usersInRoom.includes(socketId)
        ? state
        : { usersInRoom: [...state.usersInRoom, socketId] }
    ),

  removeUser: (socketId) =>
    set((state) => ({
      usersInRoom: state.usersInRoom.filter((id) => id !== socketId),
    })),

  clearUsers: () => set({ usersInRoom: [] }),
}));
