'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import {
  FeaturePills,
  MobileGateShell,
  PhoneMockCarousel,
} from '@/components/mobile-gate/mobile-gate-ui';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { DEVICE_ACCESS } from '@/lib/device-access';
import { cn } from '@/lib/utils';

export function IosGatePage() {
  const { iosAppAvailable, iosAppStoreUrl, iosTestFlightUrl } = DEVICE_ACCESS;
  const storeHref = iosAppAvailable && iosAppStoreUrl ? iosAppStoreUrl : null;
  const testFlightHref = !storeHref && iosTestFlightUrl ? iosTestFlightUrl : null;

  return (
    <MobileGateShell accent="blue">
      <div className="space-y-8 text-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5 }}>
          <p className="text-sm font-medium text-blue-300/90">Application iPhone</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Facturez comme un pro.
            <span className="block text-blue-200/90">Depuis votre poche.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            INVEQ est disponible sur iPhone. Créez devis et factures, faites signer vos clients et
            suivez vos encaissements — pensé pour le terrain.
          </p>
        </motion.div>

        <PhoneMockCarousel />

        <FeaturePills
          items={['Devis & factures', 'Signature client', 'PDF pro', 'Multi-entreprises']}
        />

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.45 }}>
          <p className="text-base font-semibold text-white">INVEQ est disponible sur iPhone.</p>

          {storeHref ? (
            <a
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 shadow-xl shadow-white/10 transition hover:bg-slate-100"
              href={storeHref}
              rel="noopener noreferrer"
              target="_blank">
              Télécharger sur l’App Store
            </a>
          ) : testFlightHref ? (
            <a
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 shadow-xl shadow-white/10 transition hover:bg-slate-100"
              href={testFlightHref}
              rel="noopener noreferrer"
              target="_blank">
              Rejoindre la bêta TestFlight
            </a>
          ) : (
            <button
              className={cn(
                'inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold',
                'bg-white/15 text-white/70 ring-1 ring-white/10',
              )}
              disabled
              type="button">
              Disponible prochainement sur l’App Store
            </button>
          )}

          <p className="text-xs text-slate-400">
            La version web est conçue pour ordinateur. Sur iPhone, utilisez l’app native.
          </p>
        </motion.div>

        <Link
          className="inline-block text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
          href={`mailto:${SUPPORT_EMAIL}`}>
          Besoin d’aide ? {SUPPORT_EMAIL}
        </Link>
      </div>
    </MobileGateShell>
  );
}
