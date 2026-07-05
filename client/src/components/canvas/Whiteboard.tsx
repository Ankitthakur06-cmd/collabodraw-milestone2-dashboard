import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import { useBoardStore } from "../../store/boardStore";
import { usePresenceStore } from "../../store/presenceStore";
import ShapeLayer from "./ShapeLayer";
import CursorLayer from "./CursorLayer";
import socket from "../../socket/socketClient";
import { saveBoardCanvas } from "../../api/apiClient";
import type { CanvasShape } from "../../types";

// Live cursor broadcast throttle (Milestone 8, Step 6). A plain
// timestamp comparison — no library — targeting ~30fps, safely inside
// the requested 16-33ms window. Only gates the socket emit; it has no
// effect on drawing, dragging, or any other mouse logic below.
const CURSOR_EMIT_INTERVAL_MS = 33;

// Dot-grid background is plain CSS on the wrapping div, not Konva
// nodes — far cheaper than rendering grid lines as shapes, and it's
// purely decorative so it doesn't need to be part of canvas state.
const GRID_STYLE = {
  backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

export default function Whiteboard() {
  const { shareId } = useParams<{ shareId: string }>();
  const shapes = useBoardStore((s) => s.shapes);
  const selectedShapeId = useBoardStore((s) => s.selectedShapeId);
  const activeTool = useBoardStore((s) => s.activeTool);
  const activeColor = useBoardStore((s) => s.activeColor);
  const strokeWidth = useBoardStore((s) => s.strokeWidth);
  const addShape = useBoardStore((s) => s.addShape);
  const updateShape = useBoardStore((s) => s.updateShape);
  const selectShape = useBoardStore((s) => s.selectShape);

  // Live cursor rendering (Milestone 8, Step 6). Read-only here —
  // presenceStore's own listeners (BoardPage.tsx) are what actually
  // populate these; Whiteboard only converts the Map into the array
  // CursorLayer expects.
  const cursors = usePresenceStore((s) => s.cursors);
  const localSocketId = usePresenceStore((s) => s.socketId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [draftShape, setDraftShape] = useState<CanvasShape | null>(null);
  const isDrawing = useRef(false);
  // Timestamp of the last "cursor-move" emit — the throttle's only
  // piece of state. A ref, not useState, since updating it must never
  // trigger a re-render.
  const lastCursorEmitRef = useRef(0);

  // Konva needs explicit pixel dimensions — measure the wrapping div
  // instead of hardcoding, and keep it in sync on window resize.
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  function handleMouseDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (activeTool === "select") {
      // Clicking empty canvas (not a shape) deselects.
      if (e.target === e.target.getStage()) {
        selectShape(null);
      }
      return;
    }

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const id = crypto.randomUUID();
    isDrawing.current = true;

    if (activeTool === "rectangle") {
      setDraftShape({ id, type: "rectangle", x: pos.x, y: pos.y, width: 0, height: 0, color: activeColor, strokeWidth });
    } else if (activeTool === "circle") {
      setDraftShape({ id, type: "circle", x: pos.x, y: pos.y, radius: 0, color: activeColor, strokeWidth });
    } else if (activeTool === "line") {
      setDraftShape({ id, type: "line", x: 0, y: 0, points: [pos.x, pos.y, pos.x, pos.y], color: activeColor, strokeWidth });
    } else if (activeTool === "freehand") {
      setDraftShape({ id, type: "freehand", x: 0, y: 0, points: [pos.x, pos.y], color: activeColor, strokeWidth });
    }
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    // Live cursor broadcast (Milestone 8, Step 6). Runs first and
    // unconditionally on every mouse move — independent of isDrawing/
    // draftShape below, so remote peers see this cursor moving even
    // when no tool is actively drawing. Same
    // getStage()/getPointerPosition() pattern used everywhere else in
    // this file. If the pointer is outside the stage, pos is null and
    // nothing is emitted — no separate mouse-leave handling needed.
    const cursorStage = e.target.getStage();
    const cursorPos = cursorStage?.getPointerPosition();
    if (cursorPos) {
      const now = Date.now();
      if (now - lastCursorEmitRef.current >= CURSOR_EMIT_INTERVAL_MS) {
        lastCursorEmitRef.current = now;
        socket.emit("cursor-move", { x: cursorPos.x, y: cursorPos.y });
      }
    }

    if (!isDrawing.current || !draftShape) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    setDraftShape((current) => {
      if (!current) return current;
      switch (current.type) {
        case "rectangle":
          return { ...current, width: pos.x - current.x, height: pos.y - current.y };
        case "circle": {
          const dx = pos.x - current.x;
          const dy = pos.y - current.y;
          return { ...current, radius: Math.sqrt(dx * dx + dy * dy) };
        }
        case "line":
          return { ...current, points: [current.points[0], current.points[1], pos.x, pos.y] };
        case "freehand":
          return { ...current, points: [...current.points, pos.x, pos.y] };
        default:
          return current;
      }
    });
  }

  // Persistence (Milestone 7): save the latest full shapes snapshot to
  // the backend after a local action has completed. Fire-and-forget —
  // sync already happened via socket; a failed save just means this
  // change won't survive a refresh, not something to block the UI on.
  function persistCanvas() {
    if (!shareId) return;
    saveBoardCanvas(shareId, useBoardStore.getState().shapes).catch(() => {});
  }

  function handleMouseUp() {
    if (isDrawing.current && draftShape) {
      addShape(draftShape);
      // Emit only after the local commit succeeds — this is the local
      // user's own finished shape, not the in-progress draft.
      socket.emit("shape-added", draftShape);
      persistCanvas();
    }
    isDrawing.current = false;
    setDraftShape(null);
  }

  function handleShapeDragEnd(id: string, x: number, y: number) {
    updateShape(id, { x, y });
    // Emit only after the local position update succeeds.
    socket.emit("shape-updated", { id, x, y });
    persistCanvas();
  }

  const allShapes = draftShape ? [...shapes, draftShape] : shapes;

  // Convert presenceStore's cursors Map into the plain array
  // CursorLayer expects. Kept here, not inside CursorLayer, so
  // CursorLayer stays a purely presentational, props-in/nodes-out
  // component (mirrors ShapeLayer's architecture). Renamed the
  // destructured key to `id` to avoid shadowing the outer
  // `localSocketId`/`socketId` variable.
  const cursorArray = Array.from(cursors.entries()).map(([id, info]) => ({
    socketId: id,
    ...info,
  }));

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-260px)] min-h-[400px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={GRID_STYLE}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          <ShapeLayer
            shapes={allShapes}
            selectedShapeId={selectedShapeId}
            interactive={activeTool === "select"}
            onSelect={selectShape}
            onDragEnd={handleShapeDragEnd}
          />
        </Layer>
        {/* Small additional Layer for remote cursors (Milestone 8,
            Step 6) — separate from the shapes Layer above so frequent
            cursor updates never trigger a redraw of committed shapes.
            Non-interactive; ShapeLayer's Layer above is untouched and
            unmoved. */}
        <Layer listening={false}>
          <CursorLayer cursors={cursorArray} localSocketId={localSocketId} />
        </Layer>
      </Stage>
    </div>
  );
}
