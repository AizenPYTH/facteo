-- Allow international postal codes on clients (FR 5 digits, PT NNNN-NNN, generic).
alter table public.clients
  drop constraint if exists clients_postal_code_format_chk;

alter table public.clients
  add constraint clients_postal_code_format_chk
  check (
    postal_code is null
    or btrim(postal_code) = ''
    or postal_code ~ '^\d{5}$'
    or postal_code ~ '^\d{4}-\d{3}$'
    or (
      postal_code ~ '^[A-Za-z0-9][A-Za-z0-9[:space:]\-]{1,11}$'
      and postal_code ~ '[0-9]'
    )
  );
