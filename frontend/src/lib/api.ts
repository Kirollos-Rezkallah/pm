import type { BoardData } from "@/lib/kanban";

const apiBase = process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResult = {
  reply: string;
  board: BoardData | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.detail || "The request could not be completed.", response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const api = {
  currentUser: () => request<{ username: string }>("/api/auth/me"),
  login: (username: string, password: string) =>
    request<{ username: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  getBoard: () => request<BoardData>("/api/board"),
  saveBoard: (board: BoardData) => request<BoardData>("/api/board", { method: "PUT", body: JSON.stringify(board) }),
  chat: (messages: ChatMessage[]) => request<ChatResult>("/api/chat", { method: "POST", body: JSON.stringify({ messages }) }),
};
