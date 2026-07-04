import { useBoardStore } from "../../store/boardStore";

const PRESET_COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];

export default function ColorPicker() {
  const activeColor = useBoardStore((s) => s.activeColor);
  const setColor = useBoardStore((s) => s.setColor);

  return (
    <div className="flex items-center gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => setColor(color)}
          aria-label={`Color ${color}`}
          className={`h-6 w-6 rounded-full border-2 transition ${
            activeColor === color ? "border-slate-900" : "border-transparent hover:border-slate-300"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <input
        type="color"
        value={activeColor}
        onChange={(e) => setColor(e.target.value)}
        title="Custom color"
        className="h-6 w-6 cursor-pointer rounded border border-slate-200 bg-transparent p-0"
      />
    </div>
  );
}
