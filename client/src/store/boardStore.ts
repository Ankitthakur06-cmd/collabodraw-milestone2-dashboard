import { create } from "zustand";
import type { CanvasShape, ToolType } from "../types";

// Active board's local canvas state (Local Canvas milestone, Phase 3).
// Reuses the existing boardStore.ts rather than introducing a second
// canvas store. Shapes are array-based, not the original Map placeholder
// — the Map was never actually populated by any code, so switching it
// is not a rewrite of working logic, just filling in the placeholder.
//
// This store is purely local/in-memory: nothing here is persisted to
// the backend yet (no elements[] sync) — that's Phase 4 (Socket.IO).
// Undo is a simple one-level-deep-per-action history stack, scoped to
// what's actually needed for this milestone (no redo — not required
// by this milestone's toolbar/shortcuts).

const MAX_HISTORY = 20;

interface BoardState {
  shapes: CanvasShape[];
  selectedShapeId: string | null;
  activeTool: ToolType;
  activeColor: string;
  strokeWidth: number;
  history: CanvasShape[][];

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  selectShape: (id: string | null) => void;
  addShape: (shape: CanvasShape) => void;
  updateShape: (id: string, changes: Partial<CanvasShape>) => void;
  deleteShape: (id: string) => void;
  clearCanvas: () => void;
  undo: () => void;
  // Called when BoardPage mounts/switches boards, so a previous
  // board's local doodles don't leak into a different board.
  resetCanvas: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  shapes: [],
  selectedShapeId: null,
  activeTool: "select",
  activeColor: "#000000",
  strokeWidth: 4,
  history: [],

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  selectShape: (id) => set({ selectedShapeId: id }),

  addShape: (shape) => {
    const { shapes, history } = get();
    set({
      shapes: [...shapes, shape],
      history: [...history, shapes].slice(-MAX_HISTORY),
    });
  },

  updateShape: (id, changes) => {
    const { shapes, history } = get();
    set({
      shapes: shapes.map((shape) =>
        shape.id === id ? ({ ...shape, ...changes } as CanvasShape) : shape
      ),
      history: [...history, shapes].slice(-MAX_HISTORY),
    });
  },

  deleteShape: (id) => {
    const { shapes, history, selectedShapeId } = get();
    set({
      shapes: shapes.filter((shape) => shape.id !== id),
      history: [...history, shapes].slice(-MAX_HISTORY),
      selectedShapeId: selectedShapeId === id ? null : selectedShapeId,
    });
  },

  clearCanvas: () => {
    const { shapes, history } = get();
    set({ shapes: [], history: [...history, shapes].slice(-MAX_HISTORY), selectedShapeId: null });
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({ shapes: previous, history: history.slice(0, -1), selectedShapeId: null });
  },

  resetCanvas: () =>
    set({ shapes: [], selectedShapeId: null, history: [], activeTool: "select" }),
}));
