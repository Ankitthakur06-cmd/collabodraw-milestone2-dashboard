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

export interface Shape {
  shapeId: string;
  type: string;
  data: unknown;
}

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
