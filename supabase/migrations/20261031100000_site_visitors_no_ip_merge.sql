-- Match a person by signed-in email or browser id only. IP is still recorded and shown,
-- but no longer merges people: different computers on the same Wi-Fi are separate visitors.
create or replace function public.track_visit(
  p_browser_id uuid, p_path text default null, p_referrer text default null,
  p_country text default null, p_region text default null, p_city text default null, p_source text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  h json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_ip text := nullif(trim(split_part(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', h->>'x-forwarded-for', ''), ',', 1)), '');
  v_ua text := left(h->>'user-agent', 400);
  v_country text := upper(coalesce(nullif(h->>'cf-ipcountry', ''), nullif(left(p_country, 2), '')));
  v_region text := nullif(left(p_region, 80), '');
  v_city text := nullif(left(p_city, 80), '');
  v_uid uuid := auth.uid();
  v_email text := lower(nullif(auth.jwt()->>'email', ''));
  v_path text := left(p_path, 300);
  v_id bigint;
begin
  if v_ua ~* '(bot|crawl|spider|slurp|preview|headless|lighthouse|monitor)' then return; end if;
  if v_country in ('XX', 'T1') then v_country := null; end if;

  if v_email is not null then
    select id into v_id from public.site_visitors where lower(email) = v_email order by first_seen limit 1;
  end if;
  if v_id is null and p_browser_id is not null then
    select id into v_id from public.site_visitors
     where browser_id = p_browser_id and (email is null or v_email is null or lower(email) = v_email)
     order by first_seen limit 1;
  end if;

  if v_id is null then
    insert into public.site_visitors (email, user_id, browser_id, ip, user_agent, referrer, source, first_path, last_path, country, region, city)
    values (v_email, v_uid, p_browser_id, v_ip, v_ua, left(nullif(p_referrer, ''), 300), left(nullif(p_source, ''), 80),
            v_path, v_path, v_country, v_region, v_city);
  else
    update public.site_visitors set
      visits     = visits + case when last_seen < now() - interval '30 minutes' then 1 else 0 end,
      last_seen  = now(),
      last_path  = coalesce(v_path, last_path),
      email      = coalesce(email, v_email),
      user_id    = coalesce(user_id, v_uid),
      browser_id = coalesce(browser_id, p_browser_id),
      ip         = coalesce(v_ip, ip),
      user_agent = coalesce(v_ua, user_agent),
      country    = coalesce(v_country, country),
      region     = case when v_city is not null or v_region is not null then v_region else region end,
      city       = coalesce(v_city, city)
    where id = v_id;
  end if;
end;
$$;
