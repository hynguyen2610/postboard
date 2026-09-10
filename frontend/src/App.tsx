import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import NewPostForm from "./components/NewPostForm";
import PostList from "./components/PostList";
import WindowedPostTimeline from "./components/WindowedPostTimeline";
import WebVitalsPanel from "./components/WebVitalsPanel";
import { fetchPosts } from "./api";
import { windowedLabPosts } from "./labs/windowedPostFixture";
import { markPerformance, subscribeToWebVitals } from "./webVitals";
import type { Post, WebVitalReport } from "./types";
const PAGE_SIZE = 10;
const initialTab = (): "timeline" | "windowed" =>
  new URLSearchParams(window.location.search).get("tab") === "windowed"
    ? "windowed"
    : "timeline";
export default function App() {
  const [rawQuery, setRawQuery] = useState(""),
    [query, setQuery] = useState(""),
    [posts, setPosts] = useState<Post[]>([]),
    [cursor, setCursor] = useState(0),
    [nextCursor, setNextCursor] = useState<number | null>(null),
    [total, setTotal] = useState(0),
    [feedTotal, setFeedTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [loadingMore, setLoadingMore] = useState(false),
    [error, setError] = useState<string | null>(null),
    [composing, setComposing] = useState(false),
    [activeTab, setActiveTab] = useState(initialTab),
    [webVitals, setWebVitals] = useState<WebVitalReport[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => subscribeToWebVitals(setWebVitals), []);
  useEffect(() => {
    const handle = setTimeout(() => setQuery(rawQuery), 300);
    return () => clearTimeout(handle);
  }, [rawQuery]);
  useEffect(() => {
    if (activeTab !== "timeline") return;
    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPosts({
          q: query,
          limit: PAGE_SIZE,
          signal: controller.signal,
        });
        if (cancelled) return;
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
        setTotal(data.total);
        setCursor(PAGE_SIZE);
        if (!query) setFeedTotal(data.total);
      } catch (err) {
        if (
          !cancelled &&
          !(err instanceof DOMException && err.name === "AbortError")
        )
          setError(err instanceof Error ? err.message : "Unable to load posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, query]);
  async function loadMore() {
    markPerformance("post-load-more-requested");
    setLoadingMore(true);
    try {
      const data = await fetchPosts({ q: query, cursor, limit: PAGE_SIZE });
      setPosts((previous) => [...previous, ...data.posts]);
      setNextCursor(data.nextCursor);
      setCursor((current) => current + PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load posts");
    } finally {
      setLoadingMore(false);
    }
  }
  async function refresh() {
    try {
      const data = await fetchPosts({ q: query, limit: PAGE_SIZE });
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
      setTotal(data.total);
      setCursor(PAGE_SIZE);
      if (!query) setFeedTotal(data.total);
    } catch {
      /* non-critical statistics refresh */
    }
  }
  function tabChange(tab: "timeline" | "windowed") {
    if (tab === "windowed") markPerformance("windowed-lab-tab-activated");
    const params = new URLSearchParams(window.location.search);
    tab === "windowed" ? params.set("tab", "windowed") : params.delete("tab");
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
          totalPosts={feedTotal}
          onLoadSimulated={refresh}
        />
        {composing && (
          <NewPostForm
            onCreated={(post) => {
              setPosts((previous) => [post, ...previous]);
              setTotal((value) => value + 1);
              setFeedTotal((value) => value + 1);
              setComposing(false);
            }}
            onClose={() => setComposing(false)}
          />
        )}
        <div
          className="timeline-tabs"
          role="tablist"
          aria-label="Timeline examples"
        >
          <button
            className="timeline-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            onClick={() => tabChange("timeline")}
          >
            Normal timeline
          </button>
          <button
            className="timeline-tab"
            type="button"
            role="tab"
            aria-selected={activeTab === "windowed"}
            onClick={() => tabChange("windowed")}
          >
            Web Vitals timeline
          </button>
        </div>
        {activeTab === "timeline" ? (
          <PostList
            posts={posts}
            loading={loading}
            error={error}
            hasMore={nextCursor !== null}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            query={query}
          />
        ) : (
          <WindowedPostTimeline posts={windowedLabPosts} />
        )}
      </div>
      <WebVitalsPanel metrics={webVitals} />
    </main>
  );
}
