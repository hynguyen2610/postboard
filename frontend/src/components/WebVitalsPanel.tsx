import type { WebVitalReport } from "../types";
const formatValue = (metric: WebVitalReport) =>
  metric.name === "CLS"
    ? metric.value.toFixed(3)
    : `${Math.round(metric.value)} ms`;
export default function WebVitalsPanel({
  metrics,
}: {
  metrics: WebVitalReport[];
}) {
  const byName = new Map(metrics.map((metric) => [metric.name, metric]));
  return (
    <aside className="web-vitals-panel" aria-label="Web Vitals measurements">
      <h2>Web Vitals</h2>
      <p>
        Live browser measurements for this page visit. Open DevTools to inspect
        the full console report.
      </p>
      <dl>
        {["LCP", "CLS", "INP"].map((name) => {
          const metric = byName.get(name);
          return (
            <div className="web-vitals-metric" key={name}>
              <dt>{name}</dt>
              <dd>
                {metric ? (
                  <>
                    <strong
                      className={`web-vitals-rating web-vitals-rating-${metric.rating}`}
                    >
                      {formatValue(metric)}
                    </strong>
                    <span>
                      {metric.rating} · {metric.navigationType}
                    </span>
                    <span className="web-vitals-attribution">
                      {metric.attribution || "No attribution yet"}
                    </span>
                  </>
                ) : (
                  "Waiting for a browser report…"
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </aside>
  );
}
