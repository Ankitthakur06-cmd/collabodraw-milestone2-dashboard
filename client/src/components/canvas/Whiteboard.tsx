import { useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import { useBoardStore } from "../../store/boardStore";
import ShapeLayer from "./ShapeLayer";
import type { CanvasShape } from "../../types";

// Dot-grid background is plain CSS on the wrapping div, not Konva
// nodes — far cheaper than rendering grid lines as shapes, and it's
// purely decorative so it doesn't need to be part of canvas state.
const GRID_STYLE = {
  backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

export default function Whiteboard() {
  const shapes = useBoardStore((s) => s.shapes);
  const selectedShapeId = useBoardStore((s) => s.selectedShapeId);
  const activeTool = useBoardStore((s) => s.activeTool);
  const activeColor = useBoardStore((s) => s.activeColor);
  const strokeWidth = useBoardStore((s) => s.strokeWidth);
  const addShape = useBoardStore((s) => s.addShape);
  const updateShape = useBoardStore((s) => s.updateShape);
  const selectShape = useBoardStore((s) => s.selectShape);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [draftShape, setDraftShape] = useState<CanvasShape | null>(null);
  const isDrawing = useRef(false);

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

  function handleMouseUp() {
    if (isDrawing.current && draftShape) {
      addShape(draftShape);
    }
    isDrawing.current = false;
    setDraftShape(null);
  }

  const allShapes = draftShape ? [...shapes, draftShape] : shapes;

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
            onDragEnd={(id, x, y) => updateShape(id, { x, y })}
          />
        </Layer>
      </Stage>
    </div>
  );
}
