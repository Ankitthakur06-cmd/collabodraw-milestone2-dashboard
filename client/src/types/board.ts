// Board-related types.
// Moved out of the single types/index.ts barrel file as part of
// the types-folder reorganization.
//
// createdAt/updatedAt/collaborators added as OPTIONAL fields for
// Milestone 3 (Board Management) — no existing field renamed or
// removed, no structural redesign.

export interface Board {
  id: string;
  title: string;
  shareId: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
  collaborators?: string[];
}

export interface Shape {
  shapeId: string;
  type: string;
  data: unknown;
}

// Response shapes for the Board Management API (Milestone 3).
// Mirrors the { success: true, ... } convention already used by
// the auth endpoints (see types/auth.ts).

export interface BoardsResponse {
  success: true;
  boards: Board[];
}

export interface BoardResponse {
  success: true;
  board: Board;
}

export interface DeleteBoardResponse {
  success: true;
  message: string;
}
