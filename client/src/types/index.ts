// Shared TypeScript interfaces for CollaboDraw.
// Intentionally left as placeholders — filled in during the
// Auth (Phase 2), Local Canvas (Phase 3), and Sync (Phase 4) milestones.

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Board {
  id: string;
  title: string;
  shareId: string;
  ownerId: string;
  createdAt: string;
}

// Canvas shapes (Local Canvas milestone, Phase 3). Each shape carries
// its own color/strokeWidth (matches the architecture's per-shape data
// model) rather than relying on global "current" settings after creation.

interface ShapeBase {
  id: string;
  color: string;
  strokeWidth: number;
}

export interface RectangleShape extends ShapeBase {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends ShapeBase {
  type: "circle";
  x: number;
  y: number;
  radius: number;
}

export interface LineShape extends ShapeBase {
  type: "line";
  x: number;
  y: number;
  points: number[];
}

export interface FreehandShape extends ShapeBase {
  type: "freehand";
  x: number;
  y: number;
  points: number[];
}

export type CanvasShape = RectangleShape | CircleShape | LineShape | FreehandShape;

export type ToolType = "select" | "rectangle" | "circle" | "line" | "freehand";

// Auth payloads/responses — added in Phase 2 (Authentication).

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
