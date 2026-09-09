import type { Comment, CommentTree, Post } from "./types";
const BASE = "/api";
export interface PostPage { posts: Post[]; nextCursor: number | null; total: number; }
export interface CreatePostInput { author: string; title: string; content: string; }
export interface CreateCommentInput { author: string; content: string; parentId?: string | null; }
export interface SimulationResult { added: number; tookMs: number; totalPosts: number; }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) { let message = `Request failed (${res.status})`; try { const body: unknown = await res.json(); if (typeof body === "object" && body && "error" in body && typeof body.error === "string") message = body.error; } catch { /* retain status */ } throw new Error(message); }
  return res.json() as Promise<T>;
}
export function fetchPosts({ q = "", cursor = 0, limit = 10, signal }: { q?: string; cursor?: number; limit?: number; signal?: AbortSignal } = {}) { const p = new URLSearchParams({ cursor: String(cursor), limit: String(limit) }); if (q) p.set("q", q); return request<PostPage>(`/posts?${p}`, { signal }); }
export function createPost(input: CreatePostInput) { return request<{ post: Post }>("/posts", { method: "POST", body: JSON.stringify(input) }); }
export function fetchComments(postId: string) { return request<{ comments: CommentTree[] }>(`/posts/${postId}/comments`); }
export function createComment(postId: string, input: CreateCommentInput) { return request<{ comment: Comment }>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(input) }); }
export function simulateLoad(count: number) { return request<SimulationResult>("/simulate-load", { method: "POST", body: JSON.stringify({ count }) }); }
