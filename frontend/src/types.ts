export interface Post {
  id: string;
  author: string;
  title: string;
  content: string;
  createdAt: number;
  commentCount: number;
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
export interface SampleImage {
  name: string;
  url: string;
}
export interface WebVitalReport {
  name: string;
  value: number;
  rating: string;
  id: string;
  navigationType: string;
  attribution: string;
}
export interface ApiError {
  error: string;
}
