import { Circle, Line, Rect } from "react-konva";
import type Konva from "konva";
import type { CanvasShape } from "../../types";

// Renders committed shapes (+ the in-progress draft shape while
// drawing) as Konva nodes. Kept as one file with a type switch rather
// than a shape-per-file split under canvas/shapes/ — at 4 simple shape
// kinds, splitting further wouldn't add real value for a hackathon.

interface ShapeLayerProps {
  shapes: CanvasShape[];
  selectedShapeId: string | null;
  interactive: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export default function ShapeLayer({
  shapes,
  selectedShapeId,
  interactive,
  onSelect,
  onDragEnd,
}: ShapeLayerProps) {
  return (
    <>
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;
        const commonProps = {
          key: shape.id,
          draggable: interactive,
          stroke: isSelected ? "#2563eb" : shape.color,
          strokeWidth: isSelected ? shape.strokeWidth + 1 : shape.strokeWidth,
          onClick: () => interactive && onSelect(shape.id),
          onTap: () => interactive && onSelect(shape.id),
          onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
            onDragEnd(shape.id, e.target.x(), e.target.y()),
        };

        switch (shape.type) {
          case "rectangle":
            return (
              <Rect {...commonProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} />
            );
          case "circle":
            return <Circle {...commonProps} x={shape.x} y={shape.y} radius={shape.radius} />;
          case "line":
            return <Line {...commonProps} x={shape.x} y={shape.y} points={shape.points} />;
          case "freehand":
            return (
              <Line
                {...commonProps}
                x={shape.x}
                y={shape.y}
                points={shape.points}
                tension={0.4}
                lineCap="round"
                lineJoin="round"
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
