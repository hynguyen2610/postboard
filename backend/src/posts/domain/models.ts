export interface PostMedia {
  name: string;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  content: string;
  createdAt: number;
  commentCount: number;
  media: PostMedia[];
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: string;
  content: string;
  createdAt: number;
  depth: number;
}

export interface CommentTree extends Comment {
  replies: CommentTree[];
}

export type AddCommentResult =
  | { comment: Comment }
  | { error: "not_found" | "bad_parent" | "max_depth" };
