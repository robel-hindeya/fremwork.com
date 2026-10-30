import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; auth?: boolean };

/**
 * Calls the NestJS API. With `auth: true` the current Supabase access token is sent
 * as a Bearer token; the API verifies it with Supabase before doing anything.
 */
export async function api<T>(path: string, { body, auth, headers, ...init }: Options = {}): Promise<T> {
  const h = new Headers(headers);
  if (body !== undefined) h.set('Content-Type', 'application/json');
  if (auth) {
    const { data } = await getSupabaseBrowserClient().auth.getSession();
    const token = data.session?.access_token;
    if (token) h.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = 'Something went wrong. Try again.';
    try {
      const j = await res.json();
      message = Array.isArray(j.message) ? j.message[0] : j.message || message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  const type = res.headers.get('content-type') || '';
  return (type.includes('application/json') ? await res.json() : await res.text()) as T;
}

/** Downloads a file from an authenticated API endpoint. */
export async function downloadFromApi(path: string, filename: string) {
  const csv = await api<string>(path, { auth: true });
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Shared shapes returned by the API ----

export type EventType = 'WEBINAR' | 'WORKSHOP' | 'MEETUP' | 'OFFICE HOURS';

export interface PublicEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  length: string;
  whenLabel: string | null;
  startsAt: string | null;
  location: string;
  capacity: number;
}

export interface PublicSettings {
  acceptSignups: boolean;
  askCompany: boolean;
  requiredFields: Record<string, boolean>;
}

export interface Registration {
  id: number;
  eventId: string;
  cancelToken: string;
  answers: Record<string, string>;
}
