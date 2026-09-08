import { useState } from "react";
import { createPost } from "../api.js";

export default function NewPostForm({ onCreated, onClose }) {
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the post a title before publishing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { post } = await createPost({ author, title, content });
      onCreated(post);
      setAuthor("");
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        className="composer-input"
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <input
        className="composer-input composer-title"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="composer-input composer-body"
        placeholder="What's on your mind?"
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <div className="composer-actions">
        <button type="button" className="btn btn-quiet" onClick={onClose}>
          Discard
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
