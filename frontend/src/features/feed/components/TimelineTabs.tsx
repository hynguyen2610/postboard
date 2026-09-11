export type TimelineTab = "timeline" | "windowed";

export default function TimelineTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TimelineTab;
  onTabChange: (tab: TimelineTab) => void;
}) {
  return (
    <div className="timeline-tabs" role="tablist" aria-label="Timeline examples">
      <button
        className="timeline-tab"
        type="button"
        role="tab"
        aria-selected={activeTab === "timeline"}
        onClick={() => onTabChange("timeline")}
      >
        Normal timeline
      </button>
      <button
        className="timeline-tab"
        type="button"
        role="tab"
        aria-selected={activeTab === "windowed"}
        onClick={() => onTabChange("windowed")}
      >
        Web Vitals timeline
      </button>
    </div>
  );
}
