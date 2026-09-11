import { useState } from "react";
import { fetchComments } from "../../../api";
import { sampleImageForName } from "../../../labs/sampleImageCatalog";
import { relativeTime } from "../../../utils";
import CommentForm from "../../comments/components/CommentForm";
import CommentThread from "../../comments/components/CommentThread";
import type { Comment, CommentTree, Post } from "../../../types";
export default function PostItem({ post }: { post: Post }) {
  const image = sampleImageForName(post.media[0]!.name),
    [expanded, setExpanded] = useState(false),
    [comments, setComments] = useState<CommentTree[] | null>(null),
    [loadingComments, setLoadingComments] = useState(false),
    [commentCount, setCommentCount] = useState(post.commentCount),
    [error, setError] = useState<string | null>(null);
  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && comments === null) {
      setLoadingComments(true);
      setError(null);
      try {
        setComments((await fetchComments(post.id)).comments);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load comments",
        );
      } finally {
        setLoadingComments(false);
      }
    }
  }
  const countAll = (tree: CommentTree[]): number =>
    tree.reduce((sum, comment) => sum + 1 + countAll(comment.replies), 0);
  return (
    <article className="post">
      <div className="post-meta">
        <span className="post-author">{post.author}</span>
        <span className="post-time">{relativeTime(post.createdAt)}</span>
      </div>
      <h2 className="post-title">{post.title}</h2>
      {post.content && <p className="post-content">{post.content}</p>}
      <img
        className="post-image-normal"
        src={image.url}
        alt={`Sample image for ${post.title}`}
      />
      <div className="post-footer">
        <button className="link-button" onClick={toggle}>
          {expanded ? "Hide comments" : `View comments (${commentCount})`}
        </button>
      </div>
      {expanded && (
        <div className="post-comments">
          {loadingComments && <p className="muted">Loading comments…</p>}
          {error && <p className="form-error">{error}</p>}
          {!loadingComments && comments && (
            <CommentThread
              postId={post.id}
              comments={comments}
              onCommentsChange={(updater) =>
                setComments((previous) => {
                  const next = updater(previous ?? []);
                  setCommentCount(countAll(next));
                  return next;
                })
              }
            />
          )}
          {!loadingComments && (
            <CommentForm
              postId={post.id}
              placeholder="Add a comment"
              onAdded={(comment: Comment) => {
                setComments((previous) => [
                  ...(previous ?? []),
                  { ...comment, replies: [] },
                ]);
                setCommentCount((count) => count + 1);
              }}
            />
          )}
        </div>
      )}
    </article>
  );
}
