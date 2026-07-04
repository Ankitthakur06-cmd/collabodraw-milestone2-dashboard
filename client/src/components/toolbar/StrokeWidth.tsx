import { useBoardStore } from "../../store/boardStore";

export default function StrokeWidth() {
  const strokeWidth = useBoardStore((s) => s.strokeWidth);
  const setStrokeWidth = useBoardStore((s) => s.setStrokeWidth);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="stroke-width" className="text-xs text-slate-500">
        Stroke
      </label>
      <input
        id="stroke-width"
        type="range"
        min={1}
        max={12}
        value={strokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        className="w-24"
      />
      <span className="w-4 text-xs text-slate-500">{strokeWidth}</span>
    </div>
  );
}
