-- Fremwork schema: waitlist, events, registrations, settings, team.
-- The NestJS API talks to these tables with the service-role key (bypasses RLS).
-- RLS is still on everywhere so the anon key in the browser can only read published events and its own profile.

create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'admin', 'member');
create type public.waitlist_status as enum ('waiting', 'invited', 'active');
create type public.event_type as enum ('WEBINAR', 'WORKSHOP', 'MEETUP', 'OFFICE HOURS');

-- Profiles ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now()
);

-- Waitlist ------------------------------------------------------------------
create table public.waitlist_entries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) <= 320),
  company text,
  role text,
  status public.waitlist_status not null default 'waiting',
  invited_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index waitlist_entries_email_key on public.waitlist_entries (lower(email));
create index waitlist_entries_created_at_idx on public.waitlist_entries (created_at desc);

-- Events --------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  type public.event_type not null default 'WEBINAR',
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  length_label text not null default '60 min',
  starts_at timestamptz,
  when_label text,               -- shown while starts_at is empty, e.g. '[DAY] · [TIME]'
  location text not null default 'Online',
  capacity int not null default 100 check (capacity > 0),
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index events_published_idx on public.events (published, sort_order, starts_at);

create table public.event_registrations (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  role text,
  company_size text,
  heard_from text,
  checked_in boolean not null default false,
  cancel_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create unique index event_registrations_event_email_key on public.event_registrations (event_id, lower(email));
create index event_registrations_event_idx on public.event_registrations (event_id);

-- Settings (single row) -----------------------------------------------------
create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  accept_signups boolean not null default true,
  welcome_email boolean not null default true,
  ask_company boolean not null default true,
  alert_instant boolean not null default true,
  alert_digest boolean not null default false,
  notify_email text not null default '',
  required_fields jsonb not null default '{"name": true, "email": true, "company": false, "role": false, "size": false, "heard": false}',
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1);

-- Team invites (who becomes an admin when they first sign in) ---------------
create table public.team_invites (
  id bigint generated always as identity primary key,
  email text not null,
  role public.app_role not null default 'admin',
  invited_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index team_invites_email_key on public.team_invites (lower(email));

-- Helpers & triggers --------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin'));
$$;

-- New auth user → profile. A pending team invite decides their role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare invited public.app_role;
begin
  select role into invited from public.team_invites where lower(email) = lower(new.email);
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), coalesce(invited, 'member'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- First confirmed sign-in → waitlist entry becomes 'active', team invite accepted.
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.waitlist_entries set status = 'active' where lower(email) = lower(new.email);
    update public.team_invites set accepted_at = now() where lower(email) = lower(new.email) and accepted_at is null;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function public.handle_user_confirmed();

-- Row level security --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.app_settings enable row level security;
alter table public.team_invites enable row level security;

create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "anyone reads published events" on public.events for select to anon, authenticated using (published or public.is_admin());
create policy "admins read waitlist" on public.waitlist_entries for select to authenticated using (public.is_admin());
create policy "admins read registrations" on public.event_registrations for select to authenticated using (public.is_admin());
create policy "admins read settings" on public.app_settings for select to authenticated using (public.is_admin());
create policy "admins read team invites" on public.team_invites for select to authenticated using (public.is_admin());
-- All writes go through the API (service role). No insert/update/delete policies on purpose.
