import { onCLS, onINP, onLCP, type Metric } from "web-vitals/attribution";
import type { WebVitalReport } from "../../types";
const subscribers = new Set<(reports: WebVitalReport[]) => void>(),
  metrics = new Map<string, WebVitalReport>();
let started = false;
function report(metric: Metric) {
  const attribution =
    (metric as Metric & { attribution?: Record<string, string> }).attribution ??
    {};
  const next: WebVitalReport = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    attribution:
      attribution.target ||
      attribution.interactionTarget ||
      attribution.largestShiftTarget ||
      attribution.url ||
      "",
  };
  metrics.set(next.name, next);
  console.info("[Web Vitals]", next);
  subscribers.forEach((subscriber) => subscriber([...metrics.values()]));
}
export function startWebVitals() {
  if (started) return;
  started = true;
  const options = { reportAllChanges: true };
  onLCP(report, options);
  onCLS(report, options);
  onINP(report, options);
}
export function subscribeToWebVitals(
  subscriber: (reports: WebVitalReport[]) => void,
) {
  subscribers.add(subscriber);
  subscriber([...metrics.values()]);
  return () => {
    subscribers.delete(subscriber);
  };
}
export function markPerformance(name: string) {
  performance.mark?.(name);
}
