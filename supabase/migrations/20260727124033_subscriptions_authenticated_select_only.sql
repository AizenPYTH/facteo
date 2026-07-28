-- Tighten authenticated privileges on subscriptions to SELECT only
-- (remove leftover TRUNCATE / TRIGGER / REFERENCES).

revoke all on table public.subscriptions from authenticated;
grant select on table public.subscriptions to authenticated;
