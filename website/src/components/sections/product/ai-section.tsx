import Link from 'next/link';

import { AiCatalogScene } from '@/components/sections/product/ai-catalog-scene';
import { Reveal } from '@/components/ui/reveal';

/**
 * Section « facturation avec IA ».
 *
 * Le sujet est encombré de promesses vagues : la plupart des pages qui se
 * positionnent sur cette requête parlent en réalité de lecture automatique des
 * factures fournisseurs, un tout autre métier. INVEQ ne fait pas cela.
 *
 * L'angle retenu est donc de dire précisément ce que l'IA fait et ce qu'elle ne
 * fait pas. C'est plus utile pour le lecteur, et c'est la seule version qui
 * reste vraie dans six mois.
 *
 * L'offre qui inclut la fonction est nommée : annoncer une capacité sans dire
 * qu'elle est réservée à un palier reviendrait à la promettre à tout le monde.
 */

const NOT_DOING = [
  'Elle ne rédige pas vos factures à votre place.',
  'Elle ne lit pas les factures que vous recevez de vos fournisseurs.',
  'Elle ne relance pas vos clients et ne décide rien pour vous.',
] as const;

export function AiSection() {
  return (
    <section
      className="border-y border-border/60 bg-[#F7F4EF]/50 px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]"
      id="ia">
      <div className="mx-auto max-w-5xl">
        <Reveal className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Intelligence artificielle
          </p>
          <h2 className="mt-4 text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            L’IA remplit votre catalogue à partir d’une photo
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Saisir un catalogue de prestations ou de fournitures est la corvée qui retarde la
            première facture. Photographiez le produit : INVEQ le lit et prépare la fiche. Vous
            n’avez plus qu’à relire.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <AiCatalogScene />
        </Reveal>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <Reveal>
            <h3 className="text-sm font-semibold text-foreground">Ce qu’elle remplit</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Six champs de la fiche produit : le nom, la description, la référence, l’unité, le
              prix hors taxes et le taux de TVA. Ils restent modifiables — l’analyse propose, elle
              n’enregistre rien sans vous.
            </p>
          </Reveal>

          <Reveal>
            <h3 className="text-sm font-semibold text-foreground">Ce qu’elle ne fait pas</h3>
            <ul className="mt-3 space-y-2">
              {NOT_DOING.map((item) => (
                <li className="text-[15px] leading-relaxed text-muted" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-8 rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-[13.5px] leading-relaxed text-muted">
            L’assistant IA est inclus dans l’offre Max. Le reste de ce qui est décrit sur cette
            page — devis, factures, suivi des règlements, catalogue — ne dépend d’aucune offre
            particulière.{' '}
            <Link className="font-medium text-foreground underline underline-offset-4" href="/tarifs">
              Voir le détail des offres
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}
