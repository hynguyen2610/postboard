import PostItem from "./PostItem.jsx";

export default function PostList({ posts, loading, error, hasMore, onLoadMore, loadingMore, query }) {
  if (loading) {
    return <p className="muted centered">Loading the timeline…</p>;
  }

  if (error) {
    return <p className="form-error centered">Couldn't load posts: {error}</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="muted centered">
        {query ? `No posts match "${query}".` : "No posts yet — be the first to publish one."}
      </p>
    );
  }

  return (
    <div>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id}>
            <PostItem post={post} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="load-more">
          <button className="btn btn-quiet" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
