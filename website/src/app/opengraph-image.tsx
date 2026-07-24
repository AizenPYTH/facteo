import { ImageResponse } from 'next/og';

import { SITE_NAME } from '@/lib/constants';

export const alt = `${SITE_NAME} — Facturation, devis et gestion pour artisans et PME`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0B0E14 0%, #312e81 48%, #4f46e5 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '40px',
          }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, #a855f7, #2563eb)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 700,
            }}>
            I
          </div>
          <span style={{ fontSize: '48px', fontWeight: 700 }}>{SITE_NAME}</span>
        </div>
        <p style={{ fontSize: '42px', fontWeight: 700, lineHeight: 1.2, maxWidth: '900px' }}>
          Gérez vos devis et factures comme un pro.
        </p>
        <p style={{ fontSize: '24px', marginTop: '24px', color: '#c7d2fe', maxWidth: '800px' }}>
          Facturation, signatures et paiements pour artisans, freelances et PME.
        </p>
      </div>
    ),
    { ...size },
  );
}
