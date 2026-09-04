'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, Palette, Users } from 'lucide-react';

import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';
import { DURATION, EASE } from '@/lib/motion';

/**
 * Ce que fait l'application, montré plutôt qu'énuméré.
 *
 * L'ancienne version alignait huit cartes « icône + titre + phrase », toutes de
 * même poids : rien ne ressortait et le visiteur ne voyait jamais le produit.
 * Ici deux capacités portent une vraie représentation visuelle, le reste tient
 * en une liste dense — ce qui est secondaire doit avoir l'air secondaire.
 *
 * Chaque élément correspond à une fonctionnalité présente dans l'application.
 */

const TEMPLATES = [
  { name: 'Classique Bleu', color: '#2563EB' },
  { name: 'Pennylane Clean', color: '#00B386' },
  { name: 'Teal Modern', color: '#0D9488' },
  { name: 'Midnight Premium', color: '#1E1B4B' },
  { name: 'Warm Amber', color: '#D97706' },
  { name: 'Rose Élégant', color: '#DB2777' },
] as const;

const SECONDARY = [
  'Fiches clients avec recherche instantanée et remplissage par SIREN ou SIRET',
  'Catalogue de produits et de prestations réutilisables, prix et TVA préremplis',
  'Remises par ligne, unités personnalisées, TVA par prestation',
  'Signature du client sur l’écran, intégrée au PDF final',
  'Paiements partiels, historique des règlements et suivi des impayés',
  'Numérotation continue, préfixes et mentions légales paramétrables',
  'Plusieurs entreprises depuis un seul compte',
  'Application iOS et interface web sur ordinateur',
] as const;

export function CapabilitiesSection() {
  const reduce = useReducedMotion();

  return (
    <section
      className="px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]"
      id="fonctionnalites">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Le produit
          </p>
          <h2 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
            Assez complet pour votre activité, assez simple pour le chantier
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 lg:mt-14 lg:grid-cols-2">
          {/* Modèles PDF — 21, chiffre vérifié dans le registre de l'application */}
          <Reveal className="surface-card lift overflow-hidden p-6 sm:p-7">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-primary">
              <Palette aria-hidden size={18} />
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">
              21 modèles de documents
            </h3>
            <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-muted">
              Choisissez un design, ajoutez votre logo et vos couleurs. L’aperçu à l’écran est
              exactement le PDF que recevra votre client.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2.5" aria-hidden>
              {TEMPLATES.map((template, index) => (
                <motion.div
                  className="group/tpl relative overflow-hidden rounded-lg border border-border bg-white p-2"
                  key={template.name}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: DURATION.fast, delay: index * 0.05, ease: EASE }}
                  whileHover={reduce ? undefined : { y: -3 }}>
                  <div className="h-1 w-8 rounded-full" style={{ background: template.color }} />
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full rounded-full bg-slate-200" />
                    <div className="h-1 w-4/5 rounded-full bg-slate-100" />
                    <div className="h-1 w-3/5 rounded-full bg-slate-100" />
                  </div>
                  <div
                    className="mt-2 h-1.5 w-2/3 rounded-full"
                    style={{ background: `${template.color}33` }}
                  />
                </motion.div>
              ))}
            </div>
          </Reveal>

          {/* Multi-entreprises */}
          <Reveal className="surface-card lift p-6 sm:p-7" delay={0.06}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-primary">
              <Users aria-hidden size={18} />
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Plusieurs entreprises, un seul compte
            </h3>
            <p className="mt-2 max-w-sm text-[14.5px] leading-relaxed text-muted">
              Chaque espace a ses clients, ses documents et sa numérotation. On bascule de l’un à
              l’autre d’un appui, sans se déconnecter.
            </p>

            <div className="mt-6 space-y-2" aria-hidden>
              {[
                { name: 'Atelier Nord', active: true },
                { name: 'Nord Services', active: false },
              ].map((company, index) => (
                <motion.div
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    company.active
                      ? 'border-primary/30 bg-indigo-50/60'
                      : 'border-border bg-white'
                  }`}
                  key={company.name}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: DURATION.fast, delay: index * 0.08, ease: EASE }}>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                      company.active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {company.name.slice(0, 1)}
                  </span>
                  <span className="flex-1 text-[13.5px] font-medium text-foreground">
                    {company.name}
                  </span>
                  {company.active ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
                      Active
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-4 grid gap-x-8 gap-y-3 rounded-2xl border border-border/80 bg-white/60 p-6 sm:grid-cols-2 sm:p-7"
          as="ul">
          {SECONDARY.map((item) => (
            <RevealItem as="li" className="flex items-start gap-3" key={item}>
              <Check aria-hidden className="mt-0.5 shrink-0 text-primary" size={16} strokeWidth={2.5} />
              <span className="text-[14px] leading-relaxed text-foreground/85">{item}</span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
