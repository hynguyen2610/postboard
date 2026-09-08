import { useState } from "react";
import { relativeTime } from "../utils.js";
import { fetchComments } from "../api.js";
import CommentThread from "./CommentThread.jsx";
import CommentForm from "./CommentForm.jsx";

export default function PostItem({ post }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [error, setError] = useState(null);

  async function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && comments === null) {
      setLoadingComments(true);
      setError(null);
      try {
        const { comments: tree } = await fetchComments(post.id);
        setComments(tree);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingComments(false);
      }
    }
  }

  function handleTopLevelAdded(comment) {
    setComments((prev) => [...(prev || []), { ...comment, replies: [] }]);
    setCommentCount((c) => c + 1);
  }

  function countAll(tree) {
    return tree.reduce((sum, c) => sum + 1 + countAll(c.replies), 0);
  }

  function handleCommentsChange(updater) {
    setComments((prev) => {
      const next = updater(prev || []);
      setCommentCount(countAll(next));
      return next;
    });
  }

  return (
    <article className="post">
      <div className="post-meta">
        <span className="post-author">{post.author}</span>
        <span className="post-time">{relativeTime(post.createdAt)}</span>
      </div>
      <h2 className="post-title">{post.title}</h2>
      {post.content && <p className="post-content">{post.content}</p>}

      <div className="post-footer">
        <button className="link-button" onClick={handleToggle}>
          {expanded ? "Hide comments" : `View comments (${commentCount})`}
        </button>
      </div>

      {expanded && (
        <div className="post-comments">
          {loadingComments && <p className="muted">Loading comments…</p>}
          {error && <p className="form-error">{error}</p>}
          {!loadingComments && comments && (
            <CommentThread postId={post.id} comments={comments} onCommentsChange={handleCommentsChange} />
          )}
          {!loadingComments && (
            <CommentForm postId={post.id} placeholder="Add a comment" onAdded={handleTopLevelAdded} />
          )}
        </div>
      )}
    </article>
  );
}
