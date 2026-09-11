import { useEffect, useRef, useState } from "react";
import { fetchPosts } from "../../../api";
import { markPerformance } from "../../performance/webVitals";
import type { Post } from "../../../types";

const PAGE_SIZE = 10;

export function usePostFeed(query: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [feedTotal, setFeedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

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
        setCursor(PAGE_SIZE);
        if (!query) setFeedTotal(data.total);
      } catch (err) {
        if (
          !cancelled &&
          !(err instanceof DOMException && err.name === "AbortError")
        ) {
          setError(err instanceof Error ? err.message : "Unable to load posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query]);

  async function loadMore() {
    if (loadMoreInFlightRef.current || nextCursor === null) return;
    loadMoreInFlightRef.current = true;
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
      loadMoreInFlightRef.current = false;
      setLoadingMore(false);
    }
  }

  async function refresh() {
    try {
      const data = await fetchPosts({ q: query, limit: PAGE_SIZE });
      setPosts(data.posts);
      setNextCursor(data.nextCursor);
      setCursor(PAGE_SIZE);
      if (!query) setFeedTotal(data.total);
    } catch {
      /* Non-critical statistics refresh. */
    }
  }

  function prepend(post: Post) {
    setPosts((previous) => [post, ...previous]);
    setFeedTotal((value) => value + 1);
  }

  return {
    posts,
    feedTotal,
    loading,
    loadingMore,
    error,
    hasMore: nextCursor !== null,
    loadMore,
    refresh,
    prepend,
  };
}
