import { useState } from "react";
import { simulateLoad } from "../api.js";

export default function Header({ query, onQueryChange, onNewPostToggle, isComposing, totalPosts, onLoadSimulated }) {
  const [simulating, setSimulating] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  async function handleSimulate() {
    setSimulating(true);
    try {
      const result = await simulateLoad(500);
      setLastRun(result);
      onLoadSimulated();
    } catch (err) {
      setLastRun({ error: err.message });
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
        <span className="load-sim-count">{totalPosts.toLocaleString()} posts in the feed</span>
        <button className="btn btn-quiet" onClick={handleSimulate} disabled={simulating}>
          {simulating ? "Adding 500 posts…" : "Simulate heavy load (+500 posts)"}
        </button>
        {lastRun && !lastRun.error && (
          <span className="load-sim-result">
            added {lastRun.added} in {lastRun.tookMs}ms — {lastRun.totalPosts.toLocaleString()} total
          </span>
        )}
        {lastRun?.error && <span className="load-sim-result load-sim-error">{lastRun.error}</span>}
      </div>
    </header>
  );
}
