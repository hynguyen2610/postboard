import { onCLS, onINP, onLCP } from "web-vitals/attribution";

const subscribers = new Set();
const metrics = new Map();
let started = false;

function toReport(metric) {
  const attribution = metric.attribution || {};

  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    attribution: attribution.target || attribution.interactionTarget || attribution.largestShiftTarget || attribution.url || ""
  };
}

function report(metric) {
  const next = toReport(metric);
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

export function subscribeToWebVitals(subscriber) {
  subscribers.add(subscriber);
  subscriber([...metrics.values()]);
  return () => subscribers.delete(subscriber);
}

export function markPerformance(name) {
  performance.mark?.(name);
}
