import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { forwardRef, useEffect } from "react";
import { relativeTime } from "../utils";
import { markPerformance } from "../webVitals";
import {
  optimizedImageSrcSet,
  optimizedImageUrl,
  sampleImageForSeed,
} from "../labs/sampleImageCatalog";
import type { Post } from "../types";
const ROW_HEIGHT = 238,
  WINDOW_LIMIT = 5,
  OVERSCAN_COUNT = 2;
const VirtualListInner = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ style, ...props }, ref) => (
  <div {...props} ref={ref} role="list" style={style} />
));
function Preview({
  post,
  isLcpCandidate,
}: {
  post: Post;
  isLcpCandidate: boolean;
}) {
  const image = sampleImageForSeed(post.id);
  const sizes = "(max-width: 640px) calc(100vw - 32px), 640px";
  return (
    <article className="post windowed-post">
      <div className="post-meta">
        <span className="post-author">{post.author}</span>
        <span className="post-time">{relativeTime(post.createdAt)}</span>
      </div>
      <h2 className="post-title">{post.title}</h2>
      {post.content && <p className="post-content">{post.content}</p>}
      <div
        className="windowed-post-images windowed-post-images-1"
      >
        <picture>
          <source
            type="image/avif"
            srcSet={optimizedImageSrcSet(image, "avif")}
            sizes={sizes}
          />
          <img
            className="windowed-post-image"
            src={optimizedImageUrl(image, 640, "webp")}
            srcSet={optimizedImageSrcSet(image, "webp")}
            sizes={sizes}
            alt={`Sample image for ${post.title}`}
            width="640"
            height="360"
            loading={isLcpCandidate ? "eager" : "lazy"}
            fetchPriority={isLcpCandidate ? "high" : "auto"}
            decoding="async"
          />
        </picture>
      </div>
      <span className="windowed-comment-count">
        {post.commentCount} comments
      </span>
    </article>
  );
}
const Row = ({ index, style, data }: ListChildComponentProps<Post[]>) => (
  <div style={style} className="windowed-post-row" role="listitem">
    <Preview post={data[index]!} isLcpCandidate={index === 0} />
  </div>
);
export default function WindowedPostTimeline({
  posts,
  loading,
  error,
}: {
  posts: Post[];
  loading: boolean;
  error: string | null;
}) {
  useEffect(() => {
    markPerformance("windowed-lab-first-list-render");
  }, []);
  return (
    <section className="windowed-lab" aria-label="Windowed post timeline">
      <p className="windowed-lab-note">
        Backend posts rendered with React Window in a five-post viewport.
      </p>
      {loading && <p className="muted centered">Loading the timeline…</p>}
      {error && <p className="form-error centered">Couldn't load posts: {error}</p>}
      {!loading && !error && !posts.length && (
        <p className="muted centered">No posts yet — be the first to publish one.</p>
      )}
      {!loading && !error && posts.length > 0 && (
        <FixedSizeList
          className="windowed-post-list"
          height={ROW_HEIGHT * WINDOW_LIMIT}
          itemCount={posts.length}
          itemData={posts}
          itemKey={(index, data) => data[index]!.id}
          itemSize={ROW_HEIGHT}
          overscanCount={OVERSCAN_COUNT}
          innerElementType={VirtualListInner}
          width="100%"
        >
          {Row}
        </FixedSizeList>
      )}
    </section>
  );
}
