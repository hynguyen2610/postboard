import type { PostRepository } from "../domain/PostRepository.js";

export class PostService {
  constructor(private readonly posts: PostRepository) {}

  list(input: { q?: string; cursor?: number; limit?: number }) {
    return this.posts.listPosts(input);
  }

  get(postId: string) {
    return this.posts.getPost(postId);
  }

  create(input: { author?: unknown; title?: unknown; content?: unknown }) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      return { error: "title is required" } as const;
    }
    return {
      post: this.posts.addPost({
        author: typeof input.author === "string" ? input.author : undefined,
        title: input.title,
        content: typeof input.content === "string" ? input.content : undefined,
      }),
    } as const;
  }

  listComments(postId: string) {
    return this.posts.getPost(postId)
      ? { comments: this.posts.getCommentTree(postId) }
      : { error: "not_found" as const };
  }

  addComment(
    postId: string,
    input: { author?: unknown; content?: unknown; parentId?: unknown },
  ) {
    if (typeof input.content !== "string" || !input.content.trim()) {
      return { error: "content_required" as const };
    }
    return this.posts.addComment({
      postId,
      author: typeof input.author === "string" ? input.author : undefined,
      content: input.content,
      parentId: typeof input.parentId === "string" ? input.parentId : null,
    });
  }

  simulateLoad(count: number) {
    const started = Date.now();
    const added = this.posts.seedPosts(count);
    return { added, tookMs: Date.now() - started, totalPosts: this.posts.countPosts() };
  }

  count() {
    return this.posts.countPosts();
  }
}
