// Minimal typed client for the REST API.
// The JWT lives only in this module's memory: it is never written to
// localStorage/sessionStorage/cookies, so a page reload requires a new login.

export type Role = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  ownerId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string } | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: { id: string; name: string } | null;
  authorId?: string;
}

export interface InterestGroup {
  interest: string;
  totalUsers: number;
  users: { id: string; name: string }[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface Paged<T> {
  data: T;
  meta: PageMeta;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(value: string | null): void {
  token = value;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // An authenticated request rejected with 401 means the token expired or the user was removed.
    if (res.status === 401 && token) onUnauthorized?.();
    const details = json?.error?.details as { path: string; message: string }[] | undefined;
    const message = details?.length
      ? details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join("; ")
      : (json?.error?.message ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, message);
  }
  return json as T;
}

const page = (p: number, limit = 10) => `page=${p}&limit=${limit}`;

export const api = {
  register: (body: { name: string; email: string; password: string; interests: string[] }) =>
    request<{ data: User }>("POST", "/auth/register", body),
  login: (email: string, password: string) =>
    request<{ data: { token: string; expiresIn: number; user: User } }>("POST", "/auth/login", { email, password }),

  me: () => request<{ data: User }>("GET", "/users/me"),
  updateMe: (body: { name?: string; interests?: string[] }) => request<{ data: User }>("PATCH", "/users/me", body),

  listNotes: (p: number) => request<Paged<Note[]>>("GET", `/notes?${page(p)}`),
  getNote: (id: string) => request<{ data: Note }>("GET", `/notes/${id}`),
  createNote: (body: { title: string; content: string }) => request<{ data: Note }>("POST", "/notes", body),
  updateNote: (id: string, body: { title?: string; content?: string }) =>
    request<{ data: Note }>("PATCH", `/notes/${id}`, body),
  deleteNote: (id: string) => request<void>("DELETE", `/notes/${id}`),

  listPosts: (p: number) => request<Paged<Post[]>>("GET", `/posts?${page(p)}`),
  getPost: (id: string) => request<{ data: Post }>("GET", `/posts/${id}`),
  createPost: (body: { title: string; content: string }) => request<{ data: Post }>("POST", "/posts", body),
  userPosts: (userId: string, p: number) =>
    request<Paged<{ user: { id: string; name: string }; posts: Post[] }>>("GET", `/users/${userId}/posts?${page(p)}`),

  adminListUsers: (p: number) => request<Paged<User[]>>("GET", `/admin/users?${page(p)}`),
  adminCreateUser: (body: { name: string; email: string; password: string; role: Role; interests: string[] }) =>
    request<{ data: User }>("POST", "/admin/users", body),
  adminUpdateUser: (
    id: string,
    body: Partial<{ name: string; email: string; password: string; role: Role; interests: string[] }>,
  ) => request<{ data: User }>("PATCH", `/admin/users/${id}`, body),
  adminDeleteUser: (id: string) => request<void>("DELETE", `/admin/users/${id}`),
  adminListNotes: (p: number) => request<Paged<Note[]>>("GET", `/admin/notes?${page(p)}`),
  adminGetNote: (id: string) => request<{ data: Note }>("GET", `/admin/notes/${id}`),
  adminInterestGroups: (p: number) => request<Paged<InterestGroup[]>>("GET", `/admin/users/by-interests?${page(p)}`),
};

/** "chess, Reading , go" -> ["chess", "Reading", "go"] (server normalizes case). */
export const parseInterests = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");
