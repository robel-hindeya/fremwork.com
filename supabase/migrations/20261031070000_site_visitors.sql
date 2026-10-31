-- Unique website visitors for Admin › Visitors.
-- One row per person. A visit is matched to an existing person by, in order:
-- signed-in email, then browser id (kept in the browser), then IP address.
-- Refreshing or moving between pages never adds a person, and only counts as a
-- new visit after 30 minutes without activity.
create table public.site_visitors (
  id          bigint generated always as identity primary key,
  email       text,
  user_id     uuid references auth.users (id) on delete set null,
  browser_id  uuid,
  ip          text,
  user_agent  text,
  referrer    text,
  first_path  text,
  last_path   text,
  visits      integer not null default 1,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
create index site_visitors_email_idx on public.site_visitors (lower(email));
create index site_visitors_browser_idx on public.site_visitors (browser_id);
create index site_visitors_ip_idx on public.site_visitors (ip);
create index site_visitors_last_seen_idx on public.site_visitors (last_seen desc);

alter table public.site_visitors enable row level security;
create policy "Admins read visitors" on public.site_visitors for select to authenticated using (private.is_admin());
create policy "Admins delete visitors" on public.site_visitors for delete to authenticated using (private.is_admin());

create or replace function public.track_visit(p_browser_id uuid, p_path text default null, p_referrer text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  h json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := nullif(trim(split_part(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', h->>'x-forwarded-for', ''), ',', 1)), '');
  v_ua text := left(h->>'user-agent', 400);
  v_uid uuid := auth.uid();
  v_email text := lower(nullif(auth.jwt()->>'email', ''));
  v_path text := left(p_path, 300);
  v_id bigint;
begin
  if v_ua ~* '(bot|crawl|spider|slurp|preview|headless|lighthouse|monitor)' then return; end if;

  if v_email is not null then
    select id into v_id from public.site_visitors where lower(email) = v_email order by first_seen limit 1;
  end if;
  if v_id is null and p_browser_id is not null then
    select id into v_id from public.site_visitors
     where browser_id = p_browser_id and (email is null or v_email is null or lower(email) = v_email)
     order by first_seen limit 1;
  end if;
  if v_id is null and v_ip is not null then
    select id into v_id from public.site_visitors
     where ip = v_ip and (email is null or v_email is null or lower(email) = v_email)
     order by first_seen limit 1;
  end if;

  if v_id is null then
    insert into public.site_visitors (email, user_id, browser_id, ip, user_agent, referrer, first_path, last_path)
    values (v_email, v_uid, p_browser_id, v_ip, v_ua, left(nullif(p_referrer, ''), 300), v_path, v_path);
  else
    update public.site_visitors set
      visits     = visits + case when last_seen < now() - interval '30 minutes' then 1 else 0 end,
      last_seen  = now(),
      last_path  = coalesce(v_path, last_path),
      email      = coalesce(email, v_email),
      user_id    = coalesce(user_id, v_uid),
      browser_id = coalesce(browser_id, p_browser_id),
      ip         = coalesce(v_ip, ip),
      user_agent = coalesce(v_ua, user_agent)
    where id = v_id;
  end if;
end;
$$;
revoke execute on function public.track_visit(uuid, text, text) from public;
grant execute on function public.track_visit(uuid, text, text) to anon, authenticated;
