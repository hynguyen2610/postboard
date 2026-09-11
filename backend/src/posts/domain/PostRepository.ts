import type { AddCommentResult, CommentTree, Post } from "./models.js";

export interface PostRepository {
  addPost(input: { author?: string; title: string; content?: string }): Post;
  seedPosts(count: number, options?: { spreadDays?: number }): number;
  countPosts(): number;
  listPosts(input: {
    q?: string;
    cursor?: number;
    limit?: number;
  }): { posts: Post[]; nextCursor: number | null; total: number };
  getPost(id: string): Post | null;
  addComment(input: {
    postId: string;
    parentId?: string | null;
    author?: string;
    content: string;
  }): AddCommentResult;
  getCommentTree(postId: string): CommentTree[];
}
