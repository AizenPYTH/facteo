'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { SITE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MobileGateShell({
  children,
  accent = 'blue',
}: {
  children: ReactNode;
  accent?: 'blue' | 'emerald';
}) {
  const glow =
    accent === 'emerald'
      ? 'from-emerald-500/25 via-teal-400/10 to-transparent'
      : 'from-blue-500/30 via-sky-400/10 to-transparent';

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#070b14] text-white">
      <div className={cn('pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--tw-gradient-stops))]', glow)} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 pt-8 sm:max-w-xl sm:px-8">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45 }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold backdrop-blur">
            F
          </div>
          <span className="text-lg font-semibold tracking-wide">{SITE_NAME}</span>
        </motion.header>
        <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
      </div>
    </div>
  );
}

const MOCK_SCREENS = [
  {
    title: 'Devis',
    subtitle: 'Créés en quelques minutes',
    lines: ['Client · Martin SARL', 'Installation électrique', '1 280,00 € HT'],
    tone: 'blue',
  },
  {
    title: 'Factures',
    subtitle: 'Suivi des encaissements',
    lines: ['FAC-2026-014', 'Payée · 2 450 €', 'Envoyée par e-mail'],
    tone: 'indigo',
  },
  {
    title: 'Signature',
    subtitle: 'Sur place, sur iPhone',
    lines: ['Devis accepté', 'Signature client', 'PDF prêt à envoyer'],
    tone: 'sky',
  },
] as const;

export function PhoneMockCarousel() {
  return (
    <div className="relative mx-auto h-[340px] w-full max-w-sm">
      {MOCK_SCREENS.map((screen, index) => {
        const offsets = [
          'left-1/2 top-2 z-30 -translate-x-1/2 rotate-0',
          'left-[8%] top-8 z-20 -rotate-6',
          'right-[8%] top-10 z-10 rotate-6',
        ];
        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={cn('absolute w-[200px]', offsets[index])}
            initial={{ opacity: 0, y: 28 }}
            key={screen.title}
            transition={{ delay: 0.15 + index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <PhoneFrame>
              <div className="space-y-3 p-4">
                <div className="h-1.5 w-10 rounded-full bg-white/20" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200/80">
                  {screen.title}
                </p>
                <p className="text-sm font-semibold text-white">{screen.subtitle}</p>
                <div className="space-y-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
                  {screen.lines.map((line) => (
                    <div className="flex items-center gap-2" key={line}>
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      <span className="text-[11px] text-slate-200">{line}</span>
                    </div>
                  ))}
                </div>
                <div className="h-8 rounded-lg bg-gradient-to-r from-blue-500 to-sky-400 opacity-90" />
              </div>
            </PhoneFrame>
          </motion.div>
        );
      })}
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border border-white/15 bg-gradient-to-b from-slate-800 to-slate-950 p-1.5 shadow-2xl shadow-black/50">
      <div className="overflow-hidden rounded-[1.35rem] bg-[#0b1220]">
        <div className="flex justify-center py-2">
          <div className="h-1.5 w-16 rounded-full bg-white/15" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function FeaturePills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((item, index) => (
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur"
          initial={{ opacity: 0, y: 8 }}
          key={item}
          transition={{ delay: 0.35 + index * 0.05 }}>
          {item}
        </motion.span>
      ))}
    </div>
  );
}
