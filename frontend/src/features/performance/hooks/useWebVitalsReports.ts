import { useEffect, useState } from "react";
import { subscribeToWebVitals } from "../webVitals";
import type { WebVitalReport } from "../../../types";

export function useWebVitalsReports() {
  const [reports, setReports] = useState<WebVitalReport[]>([]);
  useEffect(() => subscribeToWebVitals(setReports), []);
  return reports;
}
