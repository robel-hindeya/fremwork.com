-- Names for Admin › Visitors. A visitor gets a name and email when they join the
-- waitlist, register for an event, or sign in. Everyone else stays anonymous.
alter table public.site_visitors add column if not exists name text;

-- Called by the website right after a waitlist sign-up or event registration.
-- Only accepts an email that really is on the waitlist or registered for an event.
create or replace function public.identify_visitor(p_browser_id uuid, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_name text;
begin
  if p_browser_id is null or v_email is null or v_email = '' then return; end if;
  select name into v_name from (
    select name, created_at from public.event_registrations where lower(email) = v_email
    union all
    select name, created_at from public.waitlist_entries where lower(email) = v_email
  ) x order by created_at desc limit 1;
  if v_name is null then return; end if;

  update public.site_visitors
     set name = v_name, email = coalesce(email, v_email), last_seen = now()
   where browser_id = p_browser_id and (email is null or lower(email) = v_email);
end;
$$;
revoke execute on function public.identify_visitor(uuid, text) from public;
grant execute on function public.identify_visitor(uuid, text) to anon, authenticated;

-- Signed-in visitors: take the name from their profile.
create or replace function private.name_visitor_from_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.name is null and new.user_id is not null then
    select nullif(full_name, '') into new.name from public.profiles where id = new.user_id;
  end if;
  return new;
end;
$$;
revoke execute on function private.name_visitor_from_profile() from public, anon, authenticated;
create trigger site_visitors_name_from_profile before insert or update on public.site_visitors
  for each row execute function private.name_visitor_from_profile();

-- Fill names for visitors already matched by email.
update public.site_visitors v set name = x.name
  from (
    select distinct on (lower(email)) lower(email) as em, name from (
      select email, name, created_at from public.event_registrations
      union all select email, name, created_at from public.waitlist_entries
      union all select email, full_name, created_at from public.profiles where coalesce(full_name, '') <> ''
    ) a order by lower(email), created_at desc
  ) x
 where v.name is null and v.email is not null and lower(v.email) = x.em;
