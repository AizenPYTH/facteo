'use client';

import { Suspense } from 'react';

import { LoadingState } from '@/components/app/ui';
import SubscriptionSettingsContent from './subscription-content';

export default function SubscriptionSettingsPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement de l’abonnement…" />}>
      <SubscriptionSettingsContent />
    </Suspense>
  );
}
