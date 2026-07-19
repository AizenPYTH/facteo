'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AuthLayout } from '@/components/auth/auth-layout';
import { supabase } from '@/lib/supabase';

/**
 * Fallback pour les liens auth qui arrivent avec des tokens dans le hash
 * (#access_token=… / #type=recovery) au lieu d’un ?code= PKCE.
 */
function AuthConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/auth/confirmed';
  const [message, setMessage] = useState('Activation de votre compte…');

  useEffect(() => {
    let cancelled = false;

    async function finalize() {
      const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : '';
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (cancelled) return;

        if (error) {
          setMessage('Lien invalide ou expiré.');
          router.replace('/login?error=auth');
          return;
        }

        const destination =
          type === 'recovery' ? '/reinitialiser-mot-de-passe' : next.startsWith('/') ? next : '/auth/confirmed';
        window.history.replaceState(null, '', window.location.pathname);
        router.replace(destination);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        router.replace(next.startsWith('/') ? next : '/auth/confirmed');
        return;
      }

      setMessage('Lien invalide ou expiré.');
      router.replace('/login?error=auth');
    }

    void finalize();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <AuthLayout title="Confirmation">
      <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
        <AuthConfirmInner />
      </Suspense>
    </AuthLayout>
  );
}
