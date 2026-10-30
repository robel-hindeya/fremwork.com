-- Confirmation email ("You're in.") on every new event registration.
create extension if not exists pg_net with schema extensions;

alter table public.event_registrations
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmation_error text;
-- Per-event "Get ready" checklist for the email (null = default list in the function).
alter table public.events add column if not exists prep_items text[];

-- Shared secret between the trigger and the Edge Function, kept in Vault.
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'registration_email_webhook', 'Auth for the registration-email Edge Function')
where not exists (select 1 from vault.secrets where name = 'registration_email_webhook');

create or replace function public.check_registration_webhook(p_secret text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'registration_email_webhook' and decrypted_secret = p_secret);
$$;
revoke execute on function public.check_registration_webhook(text) from public, anon, authenticated;
grant execute on function public.check_registration_webhook(text) to service_role;

create or replace function private.send_registration_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := 'https://gwdrtfcqqnvhwolbjkab.supabase.co/functions/v1/registration-email',
    body := jsonb_build_object('registration_id', new.id,
      'secret', (select decrypted_secret from vault.decrypted_secrets where name = 'registration_email_webhook')),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );
  return new;
end;
$$;
revoke execute on function private.send_registration_email() from public, anon, authenticated;

create trigger event_registrations_confirmation_email after insert on public.event_registrations
  for each row execute function private.send_registration_email();
