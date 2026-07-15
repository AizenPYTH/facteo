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
  const reset = searchParams.get('reset');

  if (error === 'auth') {
    return (
      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        Lien de connexion invalide ou expiré. Réessayez.
      </div>
    );
  }

  if (reset === '1') {
    return (
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
      </div>
    );
  }

  return null;
}
