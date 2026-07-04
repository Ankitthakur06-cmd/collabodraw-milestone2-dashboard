import { create } from "zustand";
import type { Shape } from "../types";

// Active board's shapes + tool state placeholder.
// Populated with Konva-driven drawing logic in Phase 3,
// and local undo/redo stack per the finalized architecture.

interface BoardState {
  shapes: Map<string, Shape>;
  activeTool: string;
  activeColor: string;
  strokeWidth: number;
}

export const useBoardStore = create<BoardState>(() => ({
  shapes: new Map(),
  activeTool: "freehand",
  activeColor: "#000000",
  strokeWidth: 4,
}));
