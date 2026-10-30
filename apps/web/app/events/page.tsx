import type { Metadata } from 'next';
import { EventsScreen } from '@/components/screens/EventsScreen';
import { API_URL, type PublicEvent, type PublicSettings } from '@/lib/api';

export const metadata: Metadata = { title: 'Events' };
export const revalidate = 60;

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null; // API down: the page still renders with no events.
  }
}

export default async function EventsPage() {
  const [events, settings] = await Promise.all([get<PublicEvent[]>('/events'), get<PublicSettings>('/settings/public')]);
  return <EventsScreen initialEvents={events ?? []} settings={settings} />;
}
