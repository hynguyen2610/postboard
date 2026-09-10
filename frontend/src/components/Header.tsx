import { useState } from "react";
import { simulateLoad, type SimulationResult } from "../api";
export default function Header({
  query,
  onQueryChange,
  onNewPostToggle,
  isComposing,
  totalPosts,
  onLoadSimulated,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onNewPostToggle: () => void;
  isComposing: boolean;
  totalPosts: number;
  onLoadSimulated: () => void;
}) {
  const [simulating, setSimulating] = useState(false),
    [lastRun, setLastRun] = useState<
      (SimulationResult | { error: string }) | null
    >(null);
  async function run() {
    setSimulating(true);
    try {
      setLastRun(await simulateLoad(500));
      onLoadSimulated();
    } catch (err) {
      setLastRun({
        error: err instanceof Error ? err.message : "Simulation failed",
      });
    } finally {
      setSimulating(false);
    }
  }
  return (
    <header className="header">
      <div className="header-row">
        <div className="wordmark">Postboard</div>
        <button className="btn btn-primary" onClick={onNewPostToggle}>
          {isComposing ? "Cancel" : "New post"}
        </button>
      </div>
      <div className="header-row header-row-tools">
        <input
          className="search-input"
          type="search"
          placeholder="Search posts by title, body, or author"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search posts"
        />
      </div>
      <div className="load-sim">
        <span className="load-sim-count">
          {totalPosts.toLocaleString()} posts in the feed
        </span>
        <button className="btn btn-quiet" onClick={run} disabled={simulating}>
          {simulating
            ? "Adding 500 posts…"
            : "Simulate heavy load (+500 posts)"}
        </button>
        {lastRun && !("error" in lastRun) && (
          <span className="load-sim-result">
            added {lastRun.added} in {lastRun.tookMs}ms —{" "}
            {lastRun.totalPosts.toLocaleString()} total
          </span>
        )}
        {lastRun && "error" in lastRun && (
          <span className="load-sim-result load-sim-error">
            {lastRun.error}
          </span>
        )}
      </div>
    </header>
  );
}
