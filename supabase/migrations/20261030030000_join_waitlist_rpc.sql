-- Lets the website join the waitlist directly (fallback when the API is unreachable).
-- Same rules as the API: respects "Accept new sign-ups" and "Ask for company", validates input,
-- and treats a repeat email as success without revealing it.
create or replace function public.join_waitlist(p_name text, p_email text, p_company text default null, p_role text default null)
returns json language plpgsql security definer set search_path = '' as $$
declare s public.app_settings;
begin
  select * into s from public.app_settings where id = 1;
  if not s.accept_signups then
    raise exception 'The waitlist is paused right now. Check back soon.' using errcode = 'P0001';
  end if;
  p_name := btrim(coalesce(p_name, ''));
  p_email := btrim(coalesce(p_email, ''));
  if p_name = '' or char_length(p_name) > 200 then
    raise exception 'Enter your name.' using errcode = 'P0001';
  end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or char_length(p_email) > 320 then
    raise exception 'Enter a valid email, like you@company.com.' using errcode = 'P0001';
  end if;
  if p_role is not null and p_role not in ('Business owner','Finance officer','Analyst','Accountant','Manager','Other') then
    raise exception 'Pick the role closest to yours.' using errcode = 'P0001';
  end if;
  insert into public.waitlist_entries (name, email, company, role)
  values (p_name, p_email, case when s.ask_company then nullif(btrim(left(coalesce(p_company,''), 200)), '') end, p_role)
  on conflict ((lower(email))) do nothing;
  return json_build_object('ok', true);
end;
$$;
revoke execute on function public.join_waitlist(text, text, text, text) from public;
grant execute on function public.join_waitlist(text, text, text, text) to anon, authenticated;

-- Profiles for accounts created before the trigger existed.
insert into public.profiles (id, email, full_name)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name' from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
