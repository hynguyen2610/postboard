import { FixedSizeList } from "react-window";
import { forwardRef, useEffect, useState } from "react";
import { relativeTime } from "../utils.js";
import { markPerformance } from "../webVitals.js";
import { optimizedImageSrcSet, optimizedImageUrl } from "../labs/sampleImageCatalog.js";

const ROW_HEIGHT = 238;
const WINDOW_LIMIT = 5;
// Two extra rows keep short scrolls smooth without mounting the full 2,000-post fixture.
const OVERSCAN_COUNT = 2;

const VirtualListInner = forwardRef(function VirtualListInner({ style, ...props }, ref) {
  return <div {...props} ref={ref} role="list" style={style} />;
});

function PostPreview({ post, isLcpCandidate }) {
  const imageSizes = post.images.length === 1
    ? "(max-width: 640px) calc(100vw - 32px), 640px"
    : "(max-width: 640px) calc((100vw - 40px) / 2), 320px";

  return (
    <article className="post windowed-post">
      <div className="post-meta">
        <span className="post-author">{post.author}</span>
        <span className="post-time">{relativeTime(post.createdAt)}</span>
      </div>
      <h2 className="post-title">{post.title}</h2>
      {post.content && <p className="post-content">{post.content}</p>}
      <div className={`windowed-post-images windowed-post-images-${post.images.length}`}>
        {post.images.map((image, imageIndex) => (
          <picture key={image.name}>
            <source type="image/avif" srcSet={optimizedImageSrcSet(image, "avif")} sizes={imageSizes} />
            <img
              className="windowed-post-image"
              src={optimizedImageUrl(image, post.images.length === 1 ? 640 : 320, "webp")}
              srcSet={optimizedImageSrcSet(image, "webp")}
              sizes={imageSizes}
              alt={`Sample image ${imageIndex + 1} for ${post.title}`}
              width="640"
              height="360"
              loading={isLcpCandidate && imageIndex === 0 ? "eager" : "lazy"}
              fetchpriority={isLcpCandidate && imageIndex === 0 ? "high" : "auto"}
              decoding="async"
            />
          </picture>
        ))}
      </div>
      <span className="windowed-comment-count">{post.commentCount} comments</span>
    </article>
  );
}

function PostRow({ index, style, data }) {
  return (
    <div style={style} className="windowed-post-row" role="listitem">
      <PostPreview post={data[index]} isLcpCandidate={index === 0} />
    </div>
  );
}

function UnvirtualizedPostTimeline({ posts }) {
  return (
    <div className="baseline-post-list" role="list" aria-label="Unvirtualized 2,000-post baseline">
      {posts.map((post, index) => (
        <div className="baseline-post-row" role="listitem" key={post.id}>
          <PostPreview post={post} isLcpCandidate={index === 0} />
        </div>
      ))}
    </div>
  );
}

export default function WindowedPostTimeline({ posts }) {
  const [renderMode, setRenderMode] = useState("virtualized");

  useEffect(() => {
    markPerformance("windowed-lab-first-list-render");
  }, []);

  function selectRenderMode(mode) {
    if (mode === "baseline") markPerformance("windowed-lab-baseline-enabled");
    else markPerformance("windowed-lab-virtualized-enabled");
    setRenderMode(mode);
  }

  return (
    <section className="windowed-lab" aria-label="Windowed post timeline">
      <p className="windowed-lab-note">
        A deterministic set of 2,000 posts uses one or two GitHub-hosted sample images per post. React Window renders a five-post viewport.
      </p>
      <div className="render-mode-controls" aria-label="Render mode">
        <span>Render mode</span>
        <button className="btn btn-small btn-quiet" type="button" aria-pressed={renderMode === "virtualized"} onClick={() => selectRenderMode("virtualized")}>
          Virtualized (5 rows)
        </button>
        <button className="btn btn-small btn-quiet" type="button" aria-pressed={renderMode === "baseline"} onClick={() => selectRenderMode("baseline")}>
          Baseline (2,000 rows)
        </button>
      </div>
      {renderMode === "virtualized" ? (
        <FixedSizeList
          className="windowed-post-list"
          height={ROW_HEIGHT * WINDOW_LIMIT}
          itemCount={posts.length}
          itemData={posts}
          itemKey={(index, data) => data[index].id}
          itemSize={ROW_HEIGHT}
          overscanCount={OVERSCAN_COUNT}
          innerElementType={VirtualListInner}
          width="100%"
        >
          {PostRow}
        </FixedSizeList>
      ) : (
        <UnvirtualizedPostTimeline posts={posts} />
      )}

    </section>
  );
}
