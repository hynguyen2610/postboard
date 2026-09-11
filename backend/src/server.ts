import express, { type Response } from "express";
import cors from "cors";
import { SharpDerivativeService } from "./media/infrastructure/SharpDerivativeService.js";
import { PostService } from "./posts/application/PostService.js";
import { InMemoryPostRepository } from "./posts/infrastructure/InMemoryPostRepository.js";

const app = express();
app.use(cors());
app.use(express.json());

const postRepository = new InMemoryPostRepository();
const posts = new PostService(postRepository);
posts.simulateLoad(24);
const imageDerivatives = new SharpDerivativeService();
const PORT = Number(process.env.PORT) || 4000;

function sendDerivative(res: Response, derivative: { body: Buffer; contentType: string }) {
  res
    .set({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": derivative.contentType,
    })
    .send(derivative.body);
}

function simulateReadLoad() {
  const delay = Math.min(500, Math.floor(posts.count() / 8));
  return delay
    ? new Promise<void>((resolve) => setTimeout(resolve, delay))
    : Promise.resolve();
}

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, posts: posts.count() }),
);

app.get("/api/images/:name", async (req, res) => {
  const result = await imageDerivatives.get({
    name: req.params.name,
    width: req.query.width,
    format: req.query.format,
  });
  if ("derivative" in result && result.derivative) {
    return sendDerivative(res, result.derivative);
  }
  if (result.error === "invalid") {
    return res.status(400).json({ error: "invalid image derivative request" });
  }
  console.error("Unable to create image derivative", { name: req.params.name, error: result.error });
  return res.status(502).json({ error: "image source unavailable" });
});

app.get("/api/posts", async (req, res) => {
  await simulateReadLoad();
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const cursor = Number.parseInt(String(req.query.cursor), 10) || 0;
  const limit = Math.min(50, Number.parseInt(String(req.query.limit), 10) || 10);
  res.json(posts.list({ q, cursor, limit }));
});

app.post("/api/posts", (req, res) => {
  const result = posts.create(req.body as Record<string, unknown>);
  return "error" in result
    ? res.status(400).json({ error: result.error })
    : res.status(201).json(result);
});

app.get("/api/posts/:id", (req, res) => {
  const post = posts.get(req.params.id);
  return post ? res.json({ post }) : res.status(404).json({ error: "not_found" });
});

app.get("/api/posts/:id/comments", (req, res) => {
  const result = posts.listComments(req.params.id);
  return "error" in result
    ? res.status(404).json({ error: result.error })
    : res.json(result);
});

app.post("/api/posts/:id/comments", (req, res) => {
  const result = posts.addComment(req.params.id, req.body as Record<string, unknown>);
  if ("comment" in result) return res.status(201).json(result);
  if (result.error === "content_required") {
    return res.status(400).json({ error: "content is required" });
  }
  return res.status(result.error === "not_found" ? 404 : 400).json({ error: result.error });
});

app.post("/api/simulate-load", (req, res) => {
  const parsed = Number.parseInt(
    String((req.body as { count?: unknown })?.count),
    10,
  );
  const count = Math.min(5000, Math.max(1, parsed || 500));
  res.json(posts.simulateLoad(count));
});

app.listen(PORT, () =>
  console.log(`Postboard API listening on http://localhost:${PORT}`),
);
