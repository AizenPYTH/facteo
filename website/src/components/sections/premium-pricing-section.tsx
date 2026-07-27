'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';

import { FadeIn, Stagger, StaggerItem } from '@/components/ui/fade-in';
import { useSubscription } from '@/hooks/use-subscription';
import { APP_LOGIN_URL, APP_REGISTER_URL } from '@/lib/constants';
import {
  getPremiumQrImageUrl,
  PREMIUM_APP_DEEP_LINK,
  PREMIUM_MARKETING,
} from '@/lib/premium-marketing';
import {
  isSubscriptionCheckoutConfigured,
  startPremiumCheckoutRedirect,
} from '@/lib/stripe/subscription-checkout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

type PremiumPricingSectionProps = {
  showHeader?: boolean;
};

function PremiumPricingSectionInner({ showHeader = false }: PremiumPricingSectionProps) {
  const { user } = useAuth();
  const { isPremium, isLoading: subscriptionLoading } = useSubscription();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const autoCheckoutStarted = useRef(false);
  const checkoutReady = isSubscriptionCheckoutConfigured();

  async function handleCheckout() {
    setError(null);

    if (!user) {
      router.push(
        `${APP_LOGIN_URL}?redirect=${encodeURIComponent('/tarifs?checkout=1')}`,
      );
      return;
    }

    if (isPremium) {
      router.push('/app/settings/subscription');
      return;
    }

    if (!checkoutReady) {
      setError('Le paiement n’est pas encore disponible. Réessayez plus tard.');
      return;
    }

    setLoading(true);
    try {
      await startPremiumCheckoutRedirect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      searchParams.get('checkout') !== '1' ||
      !user ||
      subscriptionLoading ||
      isPremium ||
      autoCheckoutStarted.current
    ) {
      return;
    }

    autoCheckoutStarted.current = true;
    void handleCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after login redirect
  }, [user, subscriptionLoading, isPremium, searchParams]);

  return (
    <div className="w-full">
      {showHeader ? (
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">{PREMIUM_MARKETING.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">{PREMIUM_MARKETING.subtitle}</p>
        </div>
      ) : null}

      <Stagger className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        <StaggerItem>
          <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Gratuit</p>
            <p className="mt-3 text-4xl font-bold text-foreground">0 €</p>
            <p className="mt-1 text-sm text-muted">Pour démarrer sans carte bancaire</p>
            <ul className="mt-8 flex flex-1 flex-col gap-3">
              {PREMIUM_MARKETING.comparison.map((row) => (
                <li className="flex items-start justify-between gap-4 text-sm" key={row.label}>
                  <span className="text-foreground">{row.label}</span>
                  <span className="shrink-0 font-medium text-muted">{row.free}</span>
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
              href={APP_REGISTER_URL}>
              Créer un compte gratuit
            </Link>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="relative flex h-full flex-col rounded-2xl border border-primary bg-surface p-8 shadow-xl shadow-primary/15 ring-1 ring-primary/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-md">
              Recommandé
            </span>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Premium</p>
            <p className="mt-3 text-4xl font-bold text-foreground">
              {PREMIUM_MARKETING.priceLabel}
              <span className="text-lg font-medium text-muted">
                {' '}
                {PREMIUM_MARKETING.pricePeriod}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">Sans engagement · Paiement Stripe sécurisé</p>
            <ul className="mt-8 flex flex-1 flex-col gap-3">
              {PREMIUM_MARKETING.benefits.map((benefit) => (
                <li className="flex items-start gap-2.5 text-sm text-foreground" key={benefit}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            <button
              className={cn(
                'mt-8 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60',
              )}
              disabled={loading}
              onClick={() => void handleCheckout()}
              type="button">
              {isPremium
                ? 'Gérer mon abonnement'
                : loading
                  ? 'Redirection Stripe…'
                  : user
                    ? PREMIUM_MARKETING.cta
                    : 'Se connecter pour souscrire'}
            </button>

            {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              {PREMIUM_MARKETING.guarantee}
            </p>
          </div>
        </StaggerItem>
      </Stagger>

      <FadeIn className="mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-surface p-8">
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="QR Code pour ouvrir Premium dans l’app INVEQ"
            className="mx-auto h-[180px] w-[180px] rounded-xl border border-border bg-white p-2"
            height={180}
            src={getPremiumQrImageUrl(180)}
            width={180}
          />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Préférez l’application ?</h3>
            <p className="mt-2 text-sm text-muted">
              Scannez ce QR code pour ouvrir directement l’abonnement Premium dans l’app INVEQ, ou
              utilisez le lien ci-dessous.
            </p>
            <a
              className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark"
              href={PREMIUM_APP_DEEP_LINK}>
              Ouvrir Premium dans l’app
            </a>
          </div>
        </div>
      </FadeIn>

      <FadeIn className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Fonctionnalité</th>
              <th className="px-4 py-3 font-medium">Gratuit</th>
              <th className="px-4 py-3 font-medium text-primary">Premium</th>
            </tr>
          </thead>
          <tbody>
            {PREMIUM_MARKETING.comparison.map((row) => (
              <tr className="border-t border-border" key={row.label}>
                <td className="px-4 py-3 text-foreground">{row.label}</td>
                <td className="px-4 py-3 text-muted">{row.free}</td>
                <td className="px-4 py-3 font-medium text-foreground">{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FadeIn>

      <FadeIn className="mx-auto mt-14 max-w-3xl">
        <h3 className="text-xl font-semibold text-foreground">Questions fréquentes</h3>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
          {PREMIUM_MARKETING.faq.map((item, index) => {
            const open = openFaq === index;
            return (
              <div key={item.question}>
                <button
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground"
                  onClick={() => setOpenFaq(open ? null : index)}
                  type="button">
                  {item.question}
                  <span className="text-muted">{open ? '−' : '+'}</span>
                </button>
                {open ? <p className="px-5 pb-4 text-sm text-muted">{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </FadeIn>
    </div>
  );
}

export function PremiumPricingSection(props: PremiumPricingSectionProps) {
  return (
    <Suspense
      fallback={<div className="min-h-[24rem] animate-pulse rounded-2xl bg-slate-100" />}>
      <PremiumPricingSectionInner {...props} />
    </Suspense>
  );
}
