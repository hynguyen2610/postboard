import { useState, type FormEvent } from "react";
import { createPost } from "../../../api";
import type { Post } from "../../../types";
export default function NewPostForm({
  onCreated,
  onClose,
}: {
  onCreated: (post: Post) => void;
  onClose: () => void;
}) {
  const [author, setAuthor] = useState(""),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [submitting, setSubmitting] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim())
      return setError("Give the post a title before publishing.");
    setSubmitting(true);
    setError(null);
    try {
      const { post } = await createPost({ author, title, content });
      onCreated(post);
      setAuthor("");
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish post");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form className="composer" onSubmit={submit}>
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
