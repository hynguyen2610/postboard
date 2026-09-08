import { useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import NewPostForm from "./components/NewPostForm.jsx";
import PostList from "./components/PostList.jsx";
import { fetchPosts } from "./api.js";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

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

  const abortRef = useRef(null);

  // Debounce free-text search input before it becomes the active query.
  useEffect(() => {
    const handle = setTimeout(() => setQuery(rawQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [rawQuery]);

  // Load the first page whenever the active search query changes.
  useEffect(() => {
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
  }, [query]);

  async function handleLoadMore() {
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
          onQueryChange={setRawQuery}
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
    </div>
  );
}
