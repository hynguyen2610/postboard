import { useState } from "react";
import { createComment } from "../api.js";

export default function CommentForm({ postId, parentId = null, placeholder = "Add a comment", onAdded, onCancel }) {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Write something before posting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { comment } = await createComment(postId, { author, content, parentId });
      setContent("");
      onAdded(comment);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-row">
        <input
          className="comment-form-author"
          placeholder="Name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>
      <textarea
        className="comment-form-body"
        placeholder={placeholder}
        rows={2}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        autoFocus
      />
      {error && <p className="form-error">{error}</p>}
      <div className="comment-form-actions">
        {onCancel && (
          <button type="button" className="btn btn-quiet btn-small" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-small" disabled={submitting}>
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
