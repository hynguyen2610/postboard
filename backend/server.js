import express from "express";
import cors from "cors";
import { store } from "./store.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Artificially simulates the cost of scanning a large, heavily-loaded
// timeline: the more posts currently in the store, the longer a read takes.
// This is a stand-in for "no index / full table scan under load" so the
// load-more and search behavior has something realistic to react to.
async function simulateReadLoad() {
  const total = store.countPosts();
  const delayMs = Math.min(500, Math.floor(total / 8)); // scales with dataset size
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, posts: store.countPosts() });
});

// GET /api/posts?q=&cursor=&limit=
app.get("/api/posts", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const cursor = parseInt(req.query.cursor, 10) || 0;
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);

  await simulateReadLoad();

  const { posts, nextCursor, total } = store.listPosts({ q, cursor, limit });
  res.json({ posts, nextCursor, total });
});

// POST /api/posts { author, title, content }
app.post("/api/posts", (req, res) => {
  const { author, title, content } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  const post = store.addPost({ author, title, content });
  res.status(201).json({ post });
});

app.get("/api/posts/:id", (req, res) => {
  const post = store.getPost(req.params.id);
  if (!post) return res.status(404).json({ error: "not_found" });
  res.json({ post });
});

app.get("/api/posts/:id/comments", (req, res) => {
  const post = store.getPost(req.params.id);
  if (!post) return res.status(404).json({ error: "not_found" });
  const tree = store.getCommentTree(req.params.id);
  res.json({ comments: tree });
});

// POST /api/posts/:id/comments { author, content, parentId }
app.post("/api/posts/:id/comments", (req, res) => {
  const { author, content, parentId } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "content is required" });
  }
  const result = store.addComment({ postId: req.params.id, parentId, author, content });
  if (result.error === "not_found") return res.status(404).json({ error: "post not found" });
  if (result.error === "bad_parent") return res.status(400).json({ error: "invalid parent comment" });
  if (result.error === "max_depth") {
    return res.status(400).json({ error: "replies are limited to 3 levels deep" });
  }
  res.status(201).json({ comment: result.comment });
});

// POST /api/simulate-load { count }
// Bulk-generates synthetic posts so you can see how the timeline, search,
// and pagination behave once the feed is under heavier load.
app.post("/api/simulate-load", async (req, res) => {
  const count = Math.min(5000, Math.max(1, parseInt(req.body?.count, 10) || 500));
  const startedAt = Date.now();
  const added = store.seedPosts(count);
  const tookMs = Date.now() - startedAt;
  res.json({ added, tookMs, totalPosts: store.countPosts() });
});

app.listen(PORT, () => {
  console.log(`Postboard API listening on http://localhost:${PORT}`);
});
