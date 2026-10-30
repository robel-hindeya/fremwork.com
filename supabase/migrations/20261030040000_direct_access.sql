-- Let the website work directly with Supabase when the NestJS API is unreachable.
-- Admin writes are gated by private.is_admin(); public actions go through narrow security-definer functions.
-- (Applied to project gwdrtfcqqnvhwolbjkab as migration "direct_access_policies".)

create policy "admins write events" on public.events for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins update waitlist" on public.waitlist_entries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins update registrations" on public.event_registrations for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins update settings" on public.app_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins add team invites" on public.team_invites for insert to authenticated
  with check ((select private.is_admin()));

create or replace function public.public_settings()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object('acceptSignups', accept_signups, 'askCompany', ask_company,
    'requiredFields', required_fields || '{"name": true, "email": true}'::jsonb)
  from public.app_settings where id = 1;
$$;

create or replace function public.register_for_event(p_event_id uuid, p_answers jsonb)
returns json language plpgsql security definer set search_path = '' as $$
declare ev public.events; req jsonb; k text; r public.event_registrations;
begin
  select * into ev from public.events where id = p_event_id and published;
  if not found then raise exception 'That event no longer exists.' using errcode = 'P0001'; end if;
  select required_fields || '{"name": true, "email": true}'::jsonb into req from public.app_settings where id = 1;
  for k in select key from jsonb_each(req) where value = 'true'::jsonb loop
    if btrim(coalesce(p_answers ->> k, '')) = '' then
      raise exception 'Please fill in the required fields to register.' using errcode = 'P0001';
    end if;
  end loop;
  if (p_answers ->> 'email') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Enter a valid email, like you@company.com.' using errcode = 'P0001';
  end if;
  begin
    insert into public.event_registrations (event_id, name, email, company, role, company_size, heard_from)
    values (p_event_id, left(btrim(p_answers ->> 'name'), 200), btrim(p_answers ->> 'email'),
      nullif(left(btrim(coalesce(p_answers ->> 'company', '')), 200), ''), nullif(p_answers ->> 'role', ''),
      nullif(p_answers ->> 'size', ''), nullif(p_answers ->> 'heard', ''))
    returning * into r;
  exception when unique_violation then
    raise exception 'This email is already registered for this event.' using errcode = 'P0001';
  end;
  return json_build_object('id', r.id, 'eventId', r.event_id, 'cancelToken', r.cancel_token);
end;
$$;

create or replace function public.cancel_registration(p_id bigint, p_token uuid)
returns json language sql security definer set search_path = '' as $$
  with d as (delete from public.event_registrations where id = p_id and cancel_token = p_token returning id)
  select json_build_object('ok', exists (select 1 from d));
$$;

create or replace function public.published_events()
returns setof json language sql stable security definer set search_path = '' as $$
  select json_build_object('id', e.id, 'type', e.type, 'title', e.title, 'description', e.description,
    'length', e.length_label, 'whenLabel', e.when_label, 'startsAt', e.starts_at, 'location', e.location,
    'capacity', e.capacity)
  from public.events e where e.published order by e.sort_order, e.starts_at nulls last, e.created_at desc;
$$;

revoke execute on function public.public_settings(), public.register_for_event(uuid, jsonb),
  public.cancel_registration(bigint, uuid), public.published_events() from public;
grant execute on function public.public_settings(), public.register_for_event(uuid, jsonb),
  public.cancel_registration(bigint, uuid), public.published_events() to anon, authenticated;
