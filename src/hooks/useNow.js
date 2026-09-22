import { useState, useEffect } from 'react';

// Returns Date.now(), re-rendering every `intervalMs` while `active` is true.
export default function useNow(active = true, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
