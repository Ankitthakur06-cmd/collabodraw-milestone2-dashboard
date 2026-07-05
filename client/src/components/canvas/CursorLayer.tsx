import { Circle, Group, Rect, Text } from "react-konva";

// Renders remote users' live cursor positions (Milestone 8) as Konva
// nodes. Mirrors ShapeLayer.tsx's architecture exactly: a fragment of
// Konva nodes driven entirely by props, no Zustand access, no socket
// logic, no mouse handling, no throttling, no timers, no refs, no
// internal state — purely `props in, Konva nodes out`. Whiteboard.tsx
// (later step) owns reading presenceStore.cursors and turning it into
// the plain array this component reads, and owns deciding which
// socketId is "local".

export interface RemoteCursor {
  socketId: string;
  x: number;
  y: number;
  name: string;
}

interface CursorLayerProps {
  cursors: RemoteCursor[];
  // The local socket's own id, so this component can guarantee it
  // never renders the local user's own cursor — even if the array
  // passed in were ever accidentally unfiltered upstream, this is a
  // second, cheap safety check against that specific comparison.
  localSocketId: string | null;
}

// Deterministic color per socketId (pure function of the id string, no
// storage) so the same remote user's cursor keeps a stable color across
// re-renders without needing a lookup table or any state.
function colorForSocketId(socketId: string): string {
  let hash = 0;
  for (let i = 0; i < socketId.length; i++) {
    hash = (hash * 31 + socketId.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

export default function CursorLayer({ cursors, localSocketId }: CursorLayerProps) {
  return (
    <>
      {cursors
        .filter((cursor) => cursor.socketId !== localSocketId)
        .map((cursor) => {
          const color = colorForSocketId(cursor.socketId);
          // Rough width heuristic so the label background comfortably
          // fits the text — a pure function of the label's length, not
          // a measured/ref-based size, to keep this fully presentational.
          const labelWidth = cursor.name.length * 6 + 12;

          return (
            <Group key={cursor.socketId} x={cursor.x} y={cursor.y} listening={false}>
              {/* Small colored pointer/dot at the cursor's exact position. */}
              <Circle radius={5} fill={color} stroke="#ffffff" strokeWidth={1.5} />

              {/* Small label just offset from the dot. */}
              <Group x={8} y={-18}>
                <Rect width={labelWidth} height={18} fill={color} cornerRadius={4} />
                <Text
                  text={cursor.name}
                  fontSize={11}
                  fill="#ffffff"
                  width={labelWidth}
                  height={18}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            </Group>
          );
        })}
    </>
  );
}
