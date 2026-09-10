-- Les codes postaux internationaux ne tiennent pas sur 5 chiffres (UK, CA, NL…).
alter table public.clients
  drop constraint if exists clients_postal_code_format_chk;
