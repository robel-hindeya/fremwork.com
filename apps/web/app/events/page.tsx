import type { Metadata } from 'next';
import { EventsScreen } from '@/components/screens/EventsScreen';
import { type PublicEvent, type PublicSettings } from '@/lib/api';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export const metadata: Metadata = {
  title: 'Events & Vibe Coding Training',
  description:
    'Join Fremwork live events, interactive workshops, and the 3-Day Vibe Coding Training. Learn to build and automate finance workflows with AI.',
  openGraph: {
    title: 'Events & Vibe Coding Training · Fremwork',
    description:
      'Join Fremwork live events, interactive workshops, and the 3-Day Vibe Coding Training. Learn to build and automate finance workflows with AI.',
    url: 'https://www.fremwork.com/events',
  },
};
export const revalidate = 60;

async function get<T>(path: string, rpc: string): Promise<T | null> {
  if (API) {
    try {
      const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
      if (res.ok) return (await res.json()) as T;
    } catch {}
  }
  // No API, or it failed: read straight from Supabase.
  try {
    const { data, error } = await (await getSupabaseServerClient()).rpc(rpc);
    return error ? null : (data as T);
  } catch {
    return null;
  }
}

export default async function EventsPage() {
  const [events, settings] = await Promise.all([get<PublicEvent[]>('/events', 'published_events'), get<PublicSettings>('/settings/public', 'public_settings')]);
  return <EventsScreen initialEvents={events ?? []} settings={settings} />;
}
