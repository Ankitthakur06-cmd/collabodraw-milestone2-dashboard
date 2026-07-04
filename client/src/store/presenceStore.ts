import { create } from "zustand";

// Connected users + live cursor positions placeholder.
// Kept isolated from boardStore so high-frequency cursor
// updates don't re-render the shape layer (Phase 6).

interface CursorInfo {
  x: number;
  y: number;
  name: string;
}

interface PresenceState {
  connectedUsers: Map<string, string>; // userId -> name
  cursors: Map<string, CursorInfo>;
}

export const usePresenceStore = create<PresenceState>(() => ({
  connectedUsers: new Map(),
  cursors: new Map(),
}));
