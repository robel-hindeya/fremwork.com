-- Move is_admin() out of the exposed `public` schema so it is not callable via /rest/v1/rpc.
-- Policies still use it; it returns false for anon and non-admin users.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('owner', 'admin'));
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

alter policy "read own profile" on public.profiles using (id = (select auth.uid()) or (select private.is_admin()));
alter policy "anyone reads published events" on public.events using (published or (select private.is_admin()));
alter policy "admins read waitlist" on public.waitlist_entries using ((select private.is_admin()));
alter policy "admins read registrations" on public.event_registrations using ((select private.is_admin()));
alter policy "admins read settings" on public.app_settings using ((select private.is_admin()));
alter policy "admins read team invites" on public.team_invites using ((select private.is_admin()));

drop function public.is_admin();
