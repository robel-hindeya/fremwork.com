import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Supabase client for Client Components. One instance per tab. */
export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      SUPABASE_URL,
      SUPABASE_KEY,
    );
  }
  return client;
}
