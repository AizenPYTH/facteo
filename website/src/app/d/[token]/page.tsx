import type { Metadata } from 'next';

import { PublicDocumentView } from '@/components/public-document/public-document-view';

// Lien privé envoyé au client : jamais indexé, jamais transmis en référent.
export const metadata: Metadata = {
  title: 'Document',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default async function PublicDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicDocumentView token={token} />;
}
