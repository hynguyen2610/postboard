import { FixedSizeList } from "react-window";
import { relativeTime } from "../utils.js";

const ROW_HEIGHT = 168;
const WINDOW_LIMIT = 5;

function PostRow({ index, style, data }) {
  const post = data[index];

  return (
    <div style={style} className="windowed-post-row" role="listitem">
      <article className="post windowed-post">
        <div className="post-meta">
          <span className="post-author">{post.author}</span>
          <span className="post-time">{relativeTime(post.createdAt)}</span>
        </div>
        <h2 className="post-title">{post.title}</h2>
        {post.content && <p className="post-content">{post.content}</p>}
        <span className="windowed-comment-count">{post.commentCount} comments</span>
      </article>
    </div>
  );
}

export default function WindowedPostTimeline({ posts, loading, error, hasMore, onLoadMore, loadingMore, query }) {
  if (loading) return <p className="muted centered">Loading the timeline…</p>;
  if (error) return <p className="form-error centered">Couldn't load posts: {error}</p>;
  if (posts.length === 0) {
    return <p className="muted centered">{query ? `No posts match "${query}".` : "No posts yet — be the first to publish one."}</p>;
  }

  return (
    <section className="windowed-lab" aria-label="Windowed post timeline">
      <p className="windowed-lab-note">
        React Window renders a five-post viewport while retaining the cursor-based “Load more” flow.
      </p>
      <FixedSizeList
        className="windowed-post-list"
        height={ROW_HEIGHT * WINDOW_LIMIT}
        itemCount={posts.length}
        itemData={posts}
        itemKey={(index, data) => data[index].id}
        itemSize={ROW_HEIGHT}
        role="list"
        width="100%"
      >
        {PostRow}
      </FixedSizeList>

      {hasMore && (
        <div className="load-more">
          <button className="btn btn-quiet" type="button" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </section>
  );
}
