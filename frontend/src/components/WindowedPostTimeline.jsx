import { FixedSizeList } from "react-window";
import { relativeTime } from "../utils.js";

const ROW_HEIGHT = 238;
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
        <div className={`windowed-post-images windowed-post-images-${post.images.length}`}>
          {post.images.map((src, imageIndex) => (
            <img
              key={src}
              className="windowed-post-image"
              src={src}
              alt={`Sample image ${imageIndex + 1} for ${post.title}`}
              width="320"
              height="180"
            />
          ))}
        </div>
        <span className="windowed-comment-count">{post.commentCount} comments</span>
      </article>
    </div>
  );
}

export default function WindowedPostTimeline({ posts }) {
  return (
    <section className="windowed-lab" aria-label="Windowed post timeline">
      <p className="windowed-lab-note">
        A deterministic set of 2,000 posts uses one or two local sample images per post. React Window renders a five-post viewport.
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

    </section>
  );
}
