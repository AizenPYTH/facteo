-- =============================================================================
-- Tâches planifiées INVEQ (relances, factures récurrentes).
--
-- pg_cron appelle les fonctions serveur via pg_net, avec un secret propre à
-- cette base : il est créé dans le coffre-fort (Vault) et n'en sort jamais.
-- La fonction appelée le fait vérifier par `verify_cron_secret` (service_role
-- uniquement) : ni l'application, ni le site, ni un tiers ne peut déclencher
-- un passage planifié.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'inveq_cron_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'inveq_cron_secret',
      'Authentifie les appels planifiés (pg_cron) vers les fonctions INVEQ.'
    );
  end if;
end;
$$;

create or replace function public.verify_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(length(p_secret) = 64, false) and exists (
    select 1 from vault.decrypted_secrets
    where name = 'inveq_cron_secret' and decrypted_secret = p_secret
  );
$$;

revoke all on function public.verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;

create or replace function public.invoke_scheduled_function(p_name text)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_secret text;
begin
  if p_name not in ('send-invoice-reminders', 'generate-recurring-invoices') then
    raise exception 'FUNCTION_NOT_ALLOWED';
  end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'inveq_cron_secret';
  return net.http_post(
    url := 'https://eogyopufctnqasjhsthp.supabase.co/functions/v1/' || p_name,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-inveq-cron', v_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
end;
$$;

revoke all on function public.invoke_scheduled_function(text) from public, anon, authenticated;

-- Relances : chaque heure de 8 h à 18 h (heure de Paris en hiver), pour
-- écouler les envois par paquets. Les réservations empêchent tout doublon.
select cron.schedule(
  'inveq-invoice-reminders',
  '20 7-17 * * *',
  $$select public.invoke_scheduled_function('send-invoice-reminders')$$
);
