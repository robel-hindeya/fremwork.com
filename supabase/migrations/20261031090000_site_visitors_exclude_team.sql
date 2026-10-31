-- Team members (owners/admins) are remembered but hidden from Admin › Visitors, including
-- later visits from the same browser or IP while signed out.
alter table public.site_visitors add column if not exists is_team boolean not null default false;

update public.site_visitors v set is_team = true
  from public.profiles p where p.role in ('owner', 'admin') and lower(p.email) = lower(v.email);

create or replace function private.mark_team_visitor() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not new.is_team and new.user_id is not null and exists (
       select 1 from public.profiles p where p.id = new.user_id and p.role in ('owner', 'admin')) then
    new.is_team := true;
  end if;
  return new;
end;
$$;
revoke execute on function private.mark_team_visitor() from public, anon, authenticated;
create trigger site_visitors_mark_team before insert or update of user_id, email on public.site_visitors
  for each row execute function private.mark_team_visitor();
