import { useEffect, useRef, useState } from "react";

export function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdatedAt = useRef(Date.now());

  useEffect(() => {
    const elapsed = Date.now() - lastUpdatedAt.current;
    if (elapsed >= intervalMs) {
      lastUpdatedAt.current = Date.now();
      setThrottled(value);
      return;
    }

    const timeout = setTimeout(() => {
      lastUpdatedAt.current = Date.now();
      setThrottled(value);
    }, intervalMs - elapsed);
    return () => clearTimeout(timeout);
  }, [value, intervalMs]);

  return throttled;
}
