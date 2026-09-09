import express from "express";
import cors from "cors";
import sharp from "sharp";
import { store } from "./store.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SAMPLE_IMAGE_BASE_URL = "https://raw.githubusercontent.com/yavuzceliker/sample-images/main/docs";
const IMAGE_NAME_PATTERN = /^image-([1-9]\d{0,2}|1\d{3}|2000)\.jpg$/;
const IMAGE_WIDTHS = new Set([320, 640, 1280]);
const IMAGE_FORMATS = new Set(["avif", "webp"]);
const IMAGE_CACHE_MAX_ENTRIES = 128;
const imageCache = new Map();

function sendImageDerivative(res, derivative) {
  res.set({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": derivative.contentType
  });
  res.send(derivative.body);
}

function cacheImageDerivative(key, derivative) {
  imageCache.set(key, derivative);
  if (imageCache.size > IMAGE_CACHE_MAX_ENTRIES) {
    imageCache.delete(imageCache.keys().next().value);
  }
}

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

// GET /api/images/:name?width=320|640|1280&format=avif|webp
// This deliberately proxies only the approved sample-image naming scheme; it is not a general URL proxy.
app.get("/api/images/:name", async (req, res) => {
  const { name } = req.params;
  const width = Number(req.query.width);
  const format = typeof req.query.format === "string" ? req.query.format : "";

  if (!IMAGE_NAME_PATTERN.test(name) || !IMAGE_WIDTHS.has(width) || !IMAGE_FORMATS.has(format)) {
    return res.status(400).json({ error: "invalid image derivative request" });
  }

  const cacheKey = `${name}:${width}:${format}`;
  const cached = imageCache.get(cacheKey);
  if (cached) return sendImageDerivative(res, cached);

  try {
    const source = await fetch(`${SAMPLE_IMAGE_BASE_URL}/${name}`);
    if (!source.ok) throw new Error(`upstream image request failed (${source.status})`);

    const sourceBody = Buffer.from(await source.arrayBuffer());
    const body = await sharp(sourceBody)
      .rotate()
      .resize({ width, fit: "inside", withoutEnlargement: true })
      .toFormat(format, format === "avif" ? { quality: 50, effort: 4 } : { quality: 72 })
      .toBuffer();
    const derivative = { body, contentType: `image/${format}` };
    cacheImageDerivative(cacheKey, derivative);
    return sendImageDerivative(res, derivative);
  } catch (error) {
    console.error("Unable to create image derivative", { name, width, format, error: error.message });
    return res.status(502).json({ error: "image source unavailable" });
  }
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
