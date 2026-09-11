import express, { type Response } from "express";
import cors from "cors";
import sharp from "sharp";
import { store } from "./store.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 4000;
const baseUrl = "https://raw.githubusercontent.com/yavuzceliker/sample-images/main/docs";
const namePattern = /^image-([1-9]\d{0,2}|1\d{3}|2000)\.jpg$/;
const widths = new Set([320, 480, 640, 960, 1280] as const);
const formats = new Set(["avif", "webp"] as const);

type ImageWidth = typeof widths extends Set<infer Width> ? Width : never;
type ImageFormat = typeof formats extends Set<infer Format> ? Format : never;
type Derivative = { body: Buffer; contentType: `image/${ImageFormat}` };

const cache = new Map<string, Derivative>();
const inFlight = new Map<string, Promise<Derivative>>();

function send(res: Response, derivative: Derivative) {
  res
    .set({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": derivative.contentType,
    })
    .send(derivative.body);
}

function cacheDerivative(key: string, derivative: Derivative) {
  cache.set(key, derivative);
  if (cache.size > 128) cache.delete(cache.keys().next().value!);
  return derivative;
}

async function createDerivative(
  name: string,
  width: ImageWidth,
  format: ImageFormat,
): Promise<Derivative> {
  const source = await fetch(`${baseUrl}/${name}`);
  if (!source.ok) throw new Error(`upstream image request failed (${source.status})`);

  const body = await sharp(Buffer.from(await source.arrayBuffer()))
    .rotate()
    .resize({ width, fit: "inside", withoutEnlargement: true })
    .toFormat(format, format === "avif" ? { quality: 50, effort: 4 } : { quality: 72 })
    .toBuffer();

  return { body, contentType: `image/${format}` };
}

function simulateReadLoad() {
  const delay = Math.min(500, Math.floor(store.countPosts() / 8));
  return delay
    ? new Promise<void>((resolve) => setTimeout(resolve, delay))
    : Promise.resolve();
}

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, posts: store.countPosts() }),
);

app.get("/api/images/:name", async (req, res) => {
  const name = req.params.name;
  const width = Number(req.query.width);
  const format = req.query.format;
  if (
    !namePattern.test(name) ||
    !widths.has(width as ImageWidth) ||
    typeof format !== "string" ||
    !formats.has(format as ImageFormat)
  ) {
    return res.status(400).json({ error: "invalid image derivative request" });
  }

  const typedWidth = width as ImageWidth;
  const typedFormat = format as ImageFormat;
  const key = `${name}:${typedWidth}:${typedFormat}`;
  const cached = cache.get(key);
  if (cached) return send(res, cached);

  let derivativePromise = inFlight.get(key);
  if (!derivativePromise) {
    derivativePromise = createDerivative(name, typedWidth, typedFormat)
      .then((derivative) => cacheDerivative(key, derivative))
      .finally(() => inFlight.delete(key));
    inFlight.set(key, derivativePromise);
  }

  try {
    return send(res, await derivativePromise);
  } catch (error) {
    console.error("Unable to create image derivative", {
      name,
      width: typedWidth,
      format: typedFormat,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(502).json({ error: "image source unavailable" });
  }
});

app.get("/api/posts", async (req, res) => {
  await simulateReadLoad();
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const cursor = Number.parseInt(String(req.query.cursor), 10) || 0;
  const limit = Math.min(50, Number.parseInt(String(req.query.limit), 10) || 10);
  res.json(store.listPosts({ q, cursor, limit }));
});

app.post("/api/posts", (req, res) => {
  const { author, title, content } = req.body as {
    author?: unknown;
    title?: unknown;
    content?: unknown;
  };
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  res.status(201).json({
    post: store.addPost({
      author: typeof author === "string" ? author : undefined,
      title,
      content: typeof content === "string" ? content : undefined,
    }),
  });
});

app.get("/api/posts/:id", (req, res) => {
  const post = store.getPost(req.params.id);
  return post ? res.json({ post }) : res.status(404).json({ error: "not_found" });
});

app.get("/api/posts/:id/comments", (req, res) =>
  store.getPost(req.params.id)
    ? res.json({ comments: store.getCommentTree(req.params.id) })
    : res.status(404).json({ error: "not_found" }),
);

app.post("/api/posts/:id/comments", (req, res) => {
  const { author, content, parentId } = req.body as {
    author?: unknown;
    content?: unknown;
    parentId?: unknown;
  };
  if (typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "content is required" });
  }
  const result = store.addComment({
    postId: req.params.id,
    author: typeof author === "string" ? author : undefined,
    content,
    parentId: typeof parentId === "string" ? parentId : null,
  });
  if ("error" in result) {
    return res.status(result.error === "not_found" ? 404 : 400).json({
      error: result.error,
    });
  }
  return res.status(201).json(result);
});

app.post("/api/simulate-load", (req, res) => {
  const parsed = Number.parseInt(
    String((req.body as { count?: unknown })?.count),
    10,
  );
  const count = Math.min(5000, Math.max(1, parsed || 500));
  const started = Date.now();
  const added = store.seedPosts(count);
  res.json({ added, tookMs: Date.now() - started, totalPosts: store.countPosts() });
});

app.listen(PORT, () =>
  console.log(`Postboard API listening on http://localhost:${PORT}`),
);
