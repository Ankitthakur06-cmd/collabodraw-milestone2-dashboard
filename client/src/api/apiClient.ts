import axios, { isAxiosError, type AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";
import type {
  ApiErrorResponse,
  AuthResponse,
  Board,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types";

// Single axios instance for all REST calls (auth + board CRUD), and the
// only place API calls are allowed to live, per the finalized architecture
// (Section 3: "single axios instance + auth/board calls").

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT to every outgoing request, if one exists.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling: any authenticated request that comes back
// unauthorized means the token is missing/expired/invalid, so log the
// user out everywhere. Login/register are excluded on purpose — a
// failed login attempt is wrong credentials, not an expired session,
// and is already handled by the calling code's own try/catch.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<{ success: boolean; user: User }>("/auth/me");
  return data.user;
}

export async function getBoards(): Promise<Board[]> {
  const { data } = await apiClient.get<{ success: boolean; boards: Board[] }>("/boards");
  return data.boards;
}

export async function createBoard(title: string): Promise<Board> {
  const { data } = await apiClient.post<{ success: boolean; board: Board }>("/boards", { title });
  return data.board;
}

export default apiClient;
