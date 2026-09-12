-- Nouvelle bibliothèque de modèles de document : identifiants « 01 » … « 20 ».
--
-- Les anciens identifiants sont convertis vers le modèle le plus proche
-- (même correspondance que `LEGACY_TEMPLATE_IDS` côté application). Aucun
-- utilisateur ne se retrouve sans modèle : tout identifiant inconnu bascule
-- sur « 04 » (Modern Purple), le modèle maison.

create or replace function public.map_legacy_pdf_template(value text)
returns text
language sql
immutable
as $$
  select case value
    when 'classic-blue' then '03'
    when 'pennylane-clean' then '09'
    when 'indy-modern' then '04'
    when 'henrri-minimal' then '01'
    when 'quickbooks-pro' then '13'
    when 'stripe-sleek' then '12'
    when 'freebe-fresh' then '09'
    when 'navy-corporate' then '03'
    when 'emerald-finance' then '09'
    when 'slate-professional' then '17'
    when 'warm-amber' then '14'
    when 'rose-elegant' then '15'
    when 'teal-modern' then '08'
    when 'charcoal-bold' then '11'
    when 'sky-open' then '18'
    when 'purple-creative' then '04'
    when 'coral-vibrant' then '15'
    when 'forest-organic' then '09'
    when 'midnight-premium' then '02'
    when 'sandstone-classic' then '07'
    when 'graphite-tech' then '08'
    else case
      when value ~ '^(0[1-9]|1[0-9]|20)$' then value
      else '04'
    end
  end;
$$;

update public.settings
set
  quote_template_id = public.map_legacy_pdf_template(quote_template_id),
  invoice_template_id = public.map_legacy_pdf_template(invoice_template_id)
where
  quote_template_id is distinct from public.map_legacy_pdf_template(quote_template_id)
  or invoice_template_id is distinct from public.map_legacy_pdf_template(invoice_template_id);

alter table public.settings
  alter column quote_template_id set default '04',
  alter column invoice_template_id set default '04';

drop function public.map_legacy_pdf_template(text);

comment on column public.settings.quote_template_id is
  'Identifiant du modèle de devis : « 01 » … « 20 » (voir src/lib/pdf/engine/templates).';
comment on column public.settings.invoice_template_id is
  'Identifiant du modèle de facture : « 01 » … « 20 » (voir src/lib/pdf/engine/templates).';
