import type { Metadata } from 'next';

import { IosGatePage } from '@/components/mobile-gate/ios-gate-page';

export const metadata: Metadata = {
  title: 'INVEQ sur iPhone',
  description: 'INVEQ est disponible sur iPhone. Téléchargez l’application pour facturer partout.',
  robots: { index: false, follow: false },
};

export default function MobileIosPage() {
  return <IosGatePage />;
}
