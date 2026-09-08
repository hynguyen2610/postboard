const BASE = "/api";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse failure, keep default message
    }
    throw new Error(message);
  }
  return res.json();
}

export function fetchPosts({ q = "", cursor = 0, limit = 10, signal } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("cursor", String(cursor));
  params.set("limit", String(limit));
  return request(`/posts?${params.toString()}`, { signal });
}

export function createPost({ author, title, content }) {
  return request("/posts", {
    method: "POST",
    body: JSON.stringify({ author, title, content })
  });
}

export function fetchComments(postId) {
  return request(`/posts/${postId}/comments`);
}

export function createComment(postId, { author, content, parentId }) {
  return request(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ author, content, parentId })
  });
}

export function simulateLoad(count) {
  return request("/simulate-load", {
    method: "POST",
    body: JSON.stringify({ count })
  });
}
