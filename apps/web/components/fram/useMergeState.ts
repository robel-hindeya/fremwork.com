'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Class-component style state: setState merges a partial object.
 * `get()` always returns the latest state, which timers and handlers need.
 */
export function useMergeState<S extends object>(initial: S) {
  const [state, setRaw] = useState<S>(initial);
  const ref = useRef(state);
  ref.current = state;
  const set = useCallback((patch: Partial<S> | ((s: S) => Partial<S>)) => {
    setRaw((prev) => {
      const p = typeof patch === 'function' ? (patch as (s: S) => Partial<S>)(prev) : (patch as Partial<S>);
      const next = { ...prev, ...p };
      ref.current = next;
      return next;
    });
  }, []);
  const get = useCallback(() => ref.current, []);
  return [state, set, get] as const;
}
