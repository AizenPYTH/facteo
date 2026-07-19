import type { Metadata } from 'next';

import { IosGatePage } from '@/components/mobile-gate/ios-gate-page';

export const metadata: Metadata = {
  title: 'FACTEO sur iPhone',
  description: 'FACTEO est disponible sur iPhone. Téléchargez l’application pour facturer partout.',
  robots: { index: false, follow: false },
};

export default function MobileIosPage() {
  return <IosGatePage />;
}
