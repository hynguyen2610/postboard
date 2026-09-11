import { useState } from "react";
import Header from "./Header";
import NewPostForm from "../features/posts/components/NewPostForm";
import PostList from "../features/feed/components/PostList";
import TimelineTabs, {
  type TimelineTab,
} from "../features/feed/components/TimelineTabs";
import WindowedPostTimeline from "../features/feed/components/WindowedPostTimeline";
import { usePostFeed } from "../features/feed/hooks/usePostFeed";
import { useThrottledValue } from "../hooks/useThrottledValue";
import WebVitalsPanel from "../features/performance/components/WebVitalsPanel";
import { useWebVitalsReports } from "../features/performance/hooks/useWebVitalsReports";
import { markPerformance } from "../features/performance/webVitals";

const initialTab = (): TimelineTab =>
  new URLSearchParams(window.location.search).get("tab") === "windowed"
    ? "windowed"
    : "timeline";

export default function PostboardPage() {
  const [rawQuery, setRawQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const query = useThrottledValue(rawQuery, 300);
  const webVitals = useWebVitalsReports();
  const feed = usePostFeed(query);

  function changeTab(tab: TimelineTab) {
    if (tab === "windowed") markPerformance("windowed-lab-tab-activated");
    const params = new URLSearchParams(window.location.search);
    if (tab === "windowed") params.set("tab", "windowed");
    else params.delete("tab");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`,
    );
    setActiveTab(tab);
  }

  return (
    <main className="page">
      <div className="page-inner">
        <Header
          query={rawQuery}
          onQueryChange={(value) => {
            markPerformance("post-search-updated");
            setRawQuery(value);
          }}
          onNewPostToggle={() => setComposing((value) => !value)}
          isComposing={composing}
          postCountLabel={`${feed.feedTotal.toLocaleString()} posts in the feed`}
          onLoadSimulated={feed.refresh}
        />
        {composing && (
          <NewPostForm
            onCreated={(post) => {
              feed.prepend(post);
              setComposing(false);
            }}
            onClose={() => setComposing(false)}
          />
        )}
        <TimelineTabs activeTab={activeTab} onTabChange={changeTab} />
        {activeTab === "timeline" ? (
          <PostList
            posts={feed.posts}
            loading={feed.loading}
            error={feed.error}
            hasMore={feed.hasMore}
            onLoadMore={feed.loadMore}
            loadingMore={feed.loadingMore}
            query={query}
          />
        ) : (
          <WindowedPostTimeline
            posts={feed.posts}
            loading={feed.loading}
            error={feed.error}
            hasMore={feed.hasMore}
            loadingMore={feed.loadingMore}
            onLoadMore={feed.loadMore}
          />
        )}
      </div>
      <WebVitalsPanel metrics={webVitals} />
    </main>
  );
}
