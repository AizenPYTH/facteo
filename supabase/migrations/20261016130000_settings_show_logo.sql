-- Logo sur les documents : seulement si l'entreprise l'active (Paramètres › Entreprise).
alter table public.settings
  add column if not exists show_logo boolean not null default false;

comment on column public.settings.show_logo is 'Afficher le logo de l''entreprise sur ses factures et devis (désactivé par défaut).';
