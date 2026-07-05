import { useParams } from "react-router-dom";
import { useBoardStore } from "../../store/boardStore";
import type { ToolType } from "../../types";
import ColorPicker from "./ColorPicker";
import StrokeWidth from "./StrokeWidth";
import socket from "../../socket/socketClient";
import { saveBoardCanvas } from "../../api/apiClient";

const TOOLS: { value: ToolType; label: string }[] = [
  { value: "select", label: "Pointer" },
  { value: "rectangle", label: "Rectangle" },
  { value: "circle", label: "Circle" },
  { value: "line", label: "Line" },
  { value: "freehand", label: "Free Draw" },
];

export default function Toolbar() {
  const { shareId } = useParams<{ shareId: string }>();
  const activeTool = useBoardStore((s) => s.activeTool);
  const setTool = useBoardStore((s) => s.setTool);
  const clearCanvas = useBoardStore((s) => s.clearCanvas);

  function handleClear() {
    if (window.confirm("Clear the entire canvas? This can't be undone.")) {
      clearCanvas();
      // Emit only after the local clear succeeds — not resetCanvas(),
      // which is a silent local board-switch cleanup, not a user action.
      socket.emit("canvas-cleared", {});
      // Persist (Milestone 7): shapes is now [] after clearCanvas().
      if (shareId) {
        saveBoardCanvas(shareId, useBoardStore.getState().shapes).catch(() => {});
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.value}
            type="button"
            onClick={() => setTool(tool.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTool === tool.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="border-l border-slate-200 pl-3">
        <ColorPicker />
      </div>

      <div className="border-l border-slate-200 pl-3">
        <StrokeWidth />
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="ml-auto rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Clear Canvas
      </button>
    </div>
  );
}
