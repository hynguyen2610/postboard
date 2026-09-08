import { useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import NewPostForm from "./components/NewPostForm.jsx";
import PostList from "./components/PostList.jsx";
import WindowedPostTimeline from "./components/WindowedPostTimeline.jsx";
import WebVitalsPanel from "./components/WebVitalsPanel.jsx";
import { fetchPosts } from "./api.js";
import { windowedLabPosts } from "./labs/windowedPostFixture.js";
import { markPerformance, subscribeToWebVitals } from "./webVitals.js";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function initialTab() {
  return new URLSearchParams(window.location.search).get("tab") === "windowed" ? "windowed" : "timeline";
}

export default function App() {
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [total, setTotal] = useState(0);
  const [feedTotal, setFeedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [composing, setComposing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [webVitals, setWebVitals] = useState([]);

  const abortRef = useRef(null);

  useEffect(() => subscribeToWebVitals(setWebVitals), []);

  // Debounce free-text search input before it becomes the active query.
  useEffect(() => {
    const handle = setTimeout(() => setQuery(rawQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [rawQuery]);

  // Load the first page whenever the active search query changes.
  useEffect(() => {
    if (activeTab !== "timeline") return undefined;

    let cancelled = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPosts({ q: query, cursor: 0, limit: PAGE_SIZE, signal: controller.signal });
        if (cancelled) return;
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
        setTotal(data.total);
        setCursor(PAGE_SIZE);
        if (!query) setFeedTotal(data.total);
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, query]);

  async function handleLoadMore() {
    markPerformance("post-load-more-requested");
    setLoadingMore(true);
    try {
      const data = await fetchPosts({ q: query, cursor, limit: PAGE_SIZE });
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
      setCursor(cursor + PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleQueryChange(nextQuery) {
    markPerformance("post-search-updated");
    setRawQuery(nextQuery);
  }

  function handleTabChange(tab) {
    if (tab === "windowed") markPerformance("windowed-lab-tab-activated");
    const params = new URLSearchParams(window.location.search);
    if (tab === "windowed") params.set("tab", "windowed");
    else params.delete("tab");
    const nextUrl = `${window.location.pathname}${params.size ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
    setActiveTab(tab);
  }

  function handlePostCreated(post) {
    setPosts((prev) => [post, ...prev]);
    setTotal((t) => t + 1);
    setFeedTotal((t) => t + 1);
    setComposing(false);
  }

  async function handleLoadSimulated() {
    // Refresh the current view so the new total and any matching posts show up.
    try {
      const data = await fetchPosts({ q: query, cursor: 0, limit: PAGE_SIZE });
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
      setTotal(data.total);
      setCursor(PAGE_SIZE);
      if (!query) setFeedTotal(data.total);
    } catch {
      // Non-critical — the stats bar just won't refresh this round.
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <Header
          query={rawQuery}
          onQueryChange={handleQueryChange}
          onNewPostToggle={() => setComposing((v) => !v)}
          isComposing={composing}
          totalPosts={feedTotal}
          onLoadSimulated={handleLoadSimulated}
        />

        {composing && (
          <NewPostForm onCreated={handlePostCreated} onClose={() => setComposing(false)} />
        )}

        {!loading && query && (
          <p className="result-count">
            {total} result{total === 1 ? "" : "s"} for "{query}"
          </p>
        )}

        <div className="timeline-tabs" role="tablist" aria-label="Timeline examples">
          <button
            className="timeline-tab"
            type="button"
            role="tab"
            id="timeline-tab"
            aria-selected={activeTab === "timeline"}
            aria-controls="timeline-panel"
            onClick={() => handleTabChange("timeline")}
          >
            Normal timeline
          </button>
          <button
            className="timeline-tab"
            type="button"
            role="tab"
            id="windowed-timeline-tab"
            aria-selected={activeTab === "windowed"}
            aria-controls="windowed-timeline-panel"
            onClick={() => handleTabChange("windowed")}
          >
            Web Vitals timeline
          </button>
        </div>

        {activeTab === "timeline" ? (
          <div id="timeline-panel" role="tabpanel" aria-labelledby="timeline-tab">
            <PostList
              posts={posts}
              loading={loading}
              error={error}
              hasMore={nextCursor !== null}
              onLoadMore={handleLoadMore}
              loadingMore={loadingMore}
              query={query}
            />
          </div>
        ) : (
          <div id="windowed-timeline-panel" role="tabpanel" aria-labelledby="windowed-timeline-tab">
            <WindowedPostTimeline posts={windowedLabPosts} />
          </div>
        )}
      </div>
      <WebVitalsPanel metrics={webVitals} />
    </div>
  );
}
