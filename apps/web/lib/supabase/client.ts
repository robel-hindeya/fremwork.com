import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Supabase client for Client Components. One instance per tab. */
export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://gwdrtfcqqnvhwolbjkab.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      'sb_publishable_jzmf0N9Uo3Q2ZYAfAIbWCg_xBzWttHY',
    );
  }
  return client;
}
