'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const KEY = 'fw_vid';

/** A random id that stays in this browser, so the same person is counted once. */
function browserId(): string {
  const fresh = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)));
  let id = '';
  try { id = localStorage.getItem(KEY) || ''; } catch { /* storage blocked */ }
  if (!id) id = document.cookie.match(/(?:^|; )fw_vid=([0-9a-f-]{36})/)?.[1] || '';
  if (!id) id = fresh();
  try { localStorage.setItem(KEY, id); } catch { /* storage blocked */ }
  document.cookie = `${KEY}=${id}; path=/; max-age=31536000; samesite=lax`;
  return id;
}

/**
 * Records the visit for Admin › Visitors. The database matches the person by
 * signed-in email, then this browser id, then IP, so refreshes never add anyone.
 */
export function VisitTracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith('/admin') || navigator.webdriver) return;
    const t = window.setTimeout(() => {
      const referrer = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : null;
      getSupabaseBrowserClient()
        .rpc('track_visit', { p_browser_id: browserId(), p_path: path, p_referrer: referrer })
        .then(() => undefined, () => undefined);
    }, 400);
    return () => clearTimeout(t);
  }, [path]);
  return null;
}
