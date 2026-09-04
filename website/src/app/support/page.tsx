import type { Metadata } from 'next';

import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/support` },
  title: 'Support & guide d’utilisation',
  description:
    'Centre d’aide INVEQ : guide d’utilisation, suppression de compte, codes promo et assistance technique.',
};

const GUIDE_SECTIONS = [
  {
    title: 'Créer votre compte',
    body: 'Inscrivez-vous avec votre e-mail, puis renseignez le profil de votre entreprise (raison sociale, SIREN, adresse, TVA). Ces informations apparaissent sur vos devis et factures.',
  },
  {
    title: 'Ajouter des clients',
    body: 'Créez vos clients manuellement ou via la recherche SIREN (Premium). Chaque fiche client centralise coordonnées, devis et factures.',
  },
  {
    title: 'Émettre un devis',
    body: 'Choisissez un client, ajoutez vos prestations (quantité, prix HT, TVA), générez le PDF et envoyez-le. Le client peut signer depuis l’application (Premium).',
  },
  {
    title: 'Transformer en facture',
    body: 'Convertissez un devis accepté en facture, suivez les paiements et les relances. Les numéros sont gérés automatiquement selon vos préfixes.',
  },
  {
    title: 'INVEQ Premium',
    body: 'L’abonnement Premium (6,99 €/mois) débloque les fonctionnalités avancées. Lors du paiement Stripe, vous pouvez saisir un code promo si vous en avez reçu un.',
  },
  {
    title: 'Supprimer votre compte',
    body: `Depuis Paramètres → Supprimer le compte, ou en écrivant à ${SUPPORT_EMAIL} depuis l’adresse de votre compte. Nous traitons la demande sous 30 jours.`,
  },
] as const;

export default function SupportPage() {
  return (
    <>
      <PageHero
        subtitle="Guides, codes promo et assistance pour utiliser INVEQ au quotidien."
        title="Support"
      />
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          <FadeIn>
            <div className="card-hover rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-lg font-semibold text-foreground">Documentation</h2>
              <p className="mt-2 text-sm text-muted">
                Guide d’utilisation, bonnes pratiques et réponses aux questions fréquentes.
              </p>
              <a className="mt-4 inline-block font-medium text-primary" href="#guide">
                Voir le guide
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="card-hover rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-lg font-semibold text-foreground">Assistance technique</h2>
              <p className="mt-2 text-sm text-muted">
                Bugs, questions d’utilisation, suggestions produit, codes promo.
              </p>
              <a className="mt-4 block font-medium text-primary" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>
          </FadeIn>
        </div>

        <div className="mx-auto mt-16 max-w-4xl" id="guide">
          <FadeIn>
            <h2 className="text-2xl font-semibold text-foreground">Guide d’utilisation</h2>
            <p className="mt-2 text-sm text-muted">
              Les bases pour démarrer avec INVEQ sur mobile et sur le web.
            </p>
          </FadeIn>
          <div className="mt-8 grid gap-6">
            {GUIDE_SECTIONS.map((section, index) => (
              <FadeIn delay={0.05 * index} key={section.title}>
                <article className="rounded-2xl border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
