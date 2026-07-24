'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export function LoginAlerts() {
  return (
    <Suspense>
      <LoginAlertsInner />
    </Suspense>
  );
}

function LoginAlertsInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const reset = searchParams.get('reset');

  if (error === 'auth') {
    const detail =
      message && !message.includes('session')
        ? decodeURIComponent(message)
        : null;
    return (
      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {detail && detail.length < 160
          ? detail
          : 'Connexion impossible. Le lien est invalide/expiré, ou Google n’est pas encore configuré. Réessayez.'}
      </div>
    );
  }

  if (reset === '1') {
    return (
      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Mot de passe mis à jour. Vous pouvez vous connecter.
      </div>
    );
  }

  if (searchParams.get('confirmed') === '1') {
    return (
      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        E-mail confirmé. Connectez-vous pour accéder à INVEQ.
      </div>
    );
  }

  return null;
}
