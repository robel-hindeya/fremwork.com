/**
 * Fremwork's Supabase project. Deliberately NOT read from NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY:
 * the Vercel Supabase integration injects those for a different database.
 * Override with NEXT_PUBLIC_FREMWORK_SUPABASE_URL / NEXT_PUBLIC_FREMWORK_SUPABASE_KEY if the project ever moves.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_FREMWORK_SUPABASE_URL || 'https://gwdrtfcqqnvhwolbjkab.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_FREMWORK_SUPABASE_KEY || 'sb_publishable_jzmf0N9Uo3Q2ZYAfAIbWCg_xBzWttHY';
