-- Production hardening, matched to how the NestJS API queries the database.

-- 1. Enforce event capacity in the database, so two people registering at once
--    cannot overfill an event (the API's count check alone is a race).
create or replace function public.enforce_event_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare cap int; taken int;
begin
  select capacity into cap from public.events where id = new.event_id for update;
  select count(*) into taken from public.event_registrations where event_id = new.event_id;
  if taken >= cap then
    raise exception 'This event is full. Try another date.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger event_registrations_capacity before insert on public.event_registrations
  for each row execute function public.enforce_event_capacity();

-- 2. Indexes for the admin filters and the unindexed foreign key.
create index if not exists waitlist_entries_status_idx on public.waitlist_entries (status);
create index if not exists waitlist_entries_invited_at_idx on public.waitlist_entries (invited_at desc) where invited_at is not null;
create index if not exists event_registrations_created_at_idx on public.event_registrations (created_at desc);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists team_invites_invited_by_idx on public.team_invites (invited_by);

-- 3. RLS policies: evaluate auth checks once per query, not once per row.
drop policy "read own profile" on public.profiles;
drop policy "anyone reads published events" on public.events;
drop policy "admins read waitlist" on public.waitlist_entries;
drop policy "admins read registrations" on public.event_registrations;
drop policy "admins read settings" on public.app_settings;
drop policy "admins read team invites" on public.team_invites;

create policy "read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "anyone reads published events" on public.events for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "admins read waitlist" on public.waitlist_entries for select to authenticated using ((select public.is_admin()));
create policy "admins read registrations" on public.event_registrations for select to authenticated using ((select public.is_admin()));
create policy "admins read settings" on public.app_settings for select to authenticated using ((select public.is_admin()));
create policy "admins read team invites" on public.team_invites for select to authenticated using ((select public.is_admin()));

-- 4. Internal trigger functions are not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_confirmed() from public, anon, authenticated;
revoke execute on function public.enforce_event_capacity() from public, anon, authenticated;
