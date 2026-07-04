import axios, { AxiosError } from "axios";
import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types";
import type { Board, BoardsResponse, BoardResponse, DeleteBoardResponse } from "../types";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attaches the JWT (if present) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const persistedState = localStorage.getItem("collabodraw-auth");

  if (persistedState) {
    const parsed = JSON.parse(persistedState);
    const token = parsed.state.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export async function registerUser(payload: RegisterPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: LoginPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<{ success: true; user: User }>("/auth/me");
  return data.user;
}

// ---------------------------------------------------------------
// Board Management (Milestone 3)
// Same instance, same interceptor, same error-propagation pattern
// as the auth functions above — no new Axios config introduced.
// ---------------------------------------------------------------

export async function getBoards(): Promise<Board[]> {
  const { data } = await apiClient.get<BoardsResponse>("/boards");
  return data.boards;
}

export async function createBoard(title: string): Promise<Board> {
  const { data } = await apiClient.post<BoardResponse>("/boards", { title });
  return data.board;
}

// GET /api/boards/:shareId also joins the authenticated user as a
// collaborator server-side if they aren't one already — so "join"
// and "fetch by shareId" are the same call, per the backend contract.
export async function joinBoard(shareId: string): Promise<Board> {
  const { data } = await apiClient.get<BoardResponse>(`/boards/${shareId}`);
  return data.board;
}

export async function deleteBoard(boardId: string): Promise<DeleteBoardResponse> {
  const { data } = await apiClient.delete<DeleteBoardResponse>(`/boards/${boardId}`);
  return data;
}

export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default apiClient;
