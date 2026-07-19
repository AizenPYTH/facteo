import type { Metadata } from 'next';

import { IosGatePage } from '@/components/mobile-gate/ios-gate-page';

export const metadata: Metadata = {
  title: 'Factume sur iPhone',
  description: 'Factume est disponible sur iPhone. Téléchargez l’application pour facturer partout.',
  robots: { index: false, follow: false },
};

export default function MobileIosPage() {
  return <IosGatePage />;
}
