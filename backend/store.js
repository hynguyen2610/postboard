// In-memory "database" for the Postboard demo app.
// Not persistent across restarts on purpose — this is a demo backend.

const AUTHORS = [
  "Mina Torres", "Jae Park", "Aisha Bello", "Tom Riley", "Yuki Sato",
  "Priya Nair", "Carlos Mendez", "Ingrid Holm", "Sam O'Neill", "Leila Farah",
  "Noah Kim", "Zara Khan", "Ben Alcott", "Fatima Rahman", "Oscar Lindqvist"
];

const TOPICS = [
  ["Shipped the new caching layer", "Cut p95 latency on the feed endpoint from 420ms to 90ms by adding a request-scoped cache in front of the post repository. Writeup coming once the dashboards settle."],
  ["Anyone else fighting with cursor pagination?", "Offset pagination fell over once we hit a few million rows. Moved to keyset pagination on (created_at, id) and it's been steady since."],
  ["Small win: trimmed our bundle by 180kb", "Turned out we were shipping two date libraries. Removed one, swapped call sites, done in an afternoon."],
  ["Thoughts on optimistic UI for comments?", "Curious how folks handle rollback when a comment POST fails after the UI already shows it. Toast + remove, or silent retry?"],
  ["Postmortem: the Tuesday outage", "Root cause was a connection pool exhaustion under a traffic spike. Added backpressure and a circuit breaker, retro doc linked in the comments."],
  ["Three levels of comment nesting is plenty", "Tried unlimited nesting once. Nobody read past depth four and the UI turned into a hallway of arrows. Capping at three was the right call."],
  ["Weekend project: a tiny job queue", "Wrote a ~200 line job queue backed by an in-memory heap, mostly to understand backpressure and retries better."],
  ["Search relevance is harder than it looks", "Naive substring match gets you 80% of the way, then everyone wants typo tolerance and it turns into a whole project."],
  ["Load testing before the launch", "Ran a load simulation against the timeline endpoint this morning — seeded a couple thousand extra posts to see how pagination held up."],
  ["Note to self: index the search column", "Forgot to index the column we search on. Table scans on ten thousand rows really do add up."],
  ["Nice pattern for reply threads", "Storing depth directly on the comment row instead of computing it on read made the reply-limit check trivial."],
  ["Timeline feels snappier with load-more", "Swapped infinite scroll for an explicit load-more button. Less jank, and people seem to actually prefer knowing where the bottom is."],
  ["Debouncing search input", "300ms debounce plus an abort controller for in-flight requests cleared up a bunch of flicker on fast typing."],
  ["Why we keep the demo data obviously fake", "Made every seeded post clearly synthetic so nobody mistakes the load test for real user content."],
  ["A short note on empty states", "An empty search result should tell you what happened and what to try next, not just show a blank page."]
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

class Store {
  constructor() {
    this.posts = new Map(); // id -> post
    this.comments = new Map(); // id -> comment
    this.postOrder = []; // ids, newest first
  }

  reset() {
    this.posts.clear();
    this.comments.clear();
    this.postOrder = [];
  }

  addPost({ author, title, content }) {
    const id = makeId("post");
    const post = {
      id,
      author: author?.trim() || "Anonymous",
      title: title?.trim() || "(untitled)",
      content: content?.trim() || "",
      createdAt: Date.now(),
      commentCount: 0
    };
    this.posts.set(id, post);
    this.postOrder.unshift(id);
    return post;
  }

  // Bulk-generates synthetic posts to simulate a heavily loaded feed.
  // Timestamps are spread out over the past so the timeline looks organic.
  seedPosts(count, { spreadDays = 30 } = {}) {
    const created = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      const [title, content] = randomFrom(TOPICS);
      const id = makeId("post");
      const jitter = Math.random() * spreadDays * 24 * 60 * 60 * 1000;
      const post = {
        id,
        author: randomFrom(AUTHORS),
        title,
        content,
        createdAt: now - jitter,
        commentCount: 0
      };
      this.posts.set(id, post);
      created.push(post);
    }
    // Merge into postOrder sorted by createdAt desc.
    this.postOrder = [...this.postOrder, ...created.map((p) => p.id)].sort(
      (a, b) => this.posts.get(b).createdAt - this.posts.get(a).createdAt
    );
    return created.length;
  }

  countPosts() {
    return this.postOrder.length;
  }

  listPosts({ q, cursor = 0, limit = 10 }) {
    let ids = this.postOrder;
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      ids = ids.filter((id) => {
        const p = this.posts.get(id);
        return (
          p.title.toLowerCase().includes(needle) ||
          p.content.toLowerCase().includes(needle) ||
          p.author.toLowerCase().includes(needle)
        );
      });
    }
    const slice = ids.slice(cursor, cursor + limit).map((id) => this.posts.get(id));
    const nextCursor = cursor + limit < ids.length ? cursor + limit : null;
    return { posts: slice, nextCursor, total: ids.length };
  }

  getPost(id) {
    return this.posts.get(id) || null;
  }

  // Returns the depth a new comment would have, given its parent.
  // Top-level comments (no parent) are depth 1. Max depth is 3.
  addComment({ postId, parentId, author, content }) {
    const post = this.posts.get(postId);
    if (!post) return { error: "not_found" };

    let depth = 1;
    if (parentId) {
      const parent = this.comments.get(parentId);
      if (!parent || parent.postId !== postId) return { error: "bad_parent" };
      if (parent.depth >= 3) return { error: "max_depth" };
      depth = parent.depth + 1;
    }

    const id = makeId("cmt");
    const comment = {
      id,
      postId,
      parentId: parentId || null,
      author: author?.trim() || "Anonymous",
      content: content?.trim() || "",
      createdAt: Date.now(),
      depth
    };
    this.comments.set(id, comment);
    post.commentCount += 1;
    return { comment };
  }

  // Returns comments for a post as a nested tree (max depth 3).
  getCommentTree(postId) {
    const all = [...this.comments.values()]
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt);

    const byId = new Map(all.map((c) => [c.id, { ...c, replies: [] }]));
    const roots = [];
    for (const c of byId.values()) {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId).replies.push(c);
      } else {
        roots.push(c);
      }
    }
    return roots;
  }
}

export const store = new Store();

// Seed some initial data so the app isn't empty on first load.
store.seedPosts(24, { spreadDays: 10 });
