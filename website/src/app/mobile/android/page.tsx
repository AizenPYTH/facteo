import type { Metadata } from 'next';

import { AndroidGatePage } from '@/components/mobile-gate/android-gate-page';

export const metadata: Metadata = {
  title: 'Factume arrive sur Android',
  description:
    'L’application Android Factume est en cours de développement. Inscrivez-vous pour être informé de la sortie.',
  robots: { index: false, follow: false },
};

export default function MobileAndroidPage() {
  return <AndroidGatePage />;
}
