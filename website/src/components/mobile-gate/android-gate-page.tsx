'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';

import {
  FeaturePills,
  MobileGateShell,
  PhoneMockCarousel,
} from '@/components/mobile-gate/mobile-gate-ui';
import { cn } from '@/lib/utils';

const emailSchema = z.string().trim().email('Adresse e-mail invalide.');

export function AndroidGatePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setStatus('error');
      setMessage(parsed.error.issues[0]?.message ?? 'E-mail invalide.');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch('/api/android-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parsed.data }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Impossible d’enregistrer votre e-mail.');
        return;
      }

      setStatus('success');
      setMessage('Merci ! On vous préviendra dès la sortie Android.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Erreur réseau. Réessayez dans un instant.');
    }
  }

  return (
    <MobileGateShell accent="emerald">
      <div className="space-y-8 text-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.5 }}>
          <p className="text-sm font-medium text-emerald-300/90">Android</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            L’application Android
            <span className="block text-emerald-200/90">est en cours de développement.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            FACTEO arrive bientôt sur Android. En attendant, laissez votre e-mail pour être informé
            de la sortie — et découvrez l’app dès maintenant sur iPhone.
          </p>
        </motion.div>

        <PhoneMockCarousel />

        <FeaturePills
          items={['Bientôt sur Android', 'Déjà sur iPhone', 'Web sur ordinateur']}
        />

        <motion.form
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 text-left"
          initial={{ opacity: 0, y: 12 }}
          onSubmit={onSubmit}
          transition={{ delay: 0.4 }}>
          <p className="text-center text-base font-semibold text-white">
            Être informé de la sortie Android
          </p>
          <label className="block text-xs font-medium text-slate-300" htmlFor="android-email">
            Adresse e-mail
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none ring-emerald-400/30 placeholder:text-slate-500 focus:ring-2"
            id="android-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@entreprise.fr"
            type="email"
            value={email}
          />
          <button
            className={cn(
              'inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold transition',
              'bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 hover:bg-emerald-300 disabled:opacity-60',
            )}
            disabled={status === 'loading' || status === 'success'}
            type="submit">
            {status === 'loading'
              ? 'Enregistrement…'
              : status === 'success'
                ? 'Vous êtes sur la liste'
                : 'Être informé de la sortie Android'}
          </button>
          {message ? (
            <p
              className={cn(
                'text-center text-xs',
                status === 'error' ? 'text-red-300' : 'text-emerald-200',
              )}>
              {message}
            </p>
          ) : (
            <p className="text-center text-xs text-slate-400">
              Pas de spam. Un seul e-mail le jour de la sortie.
            </p>
          )}
        </motion.form>
      </div>
    </MobileGateShell>
  );
}
