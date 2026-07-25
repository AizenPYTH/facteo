import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { SITE_NAME } from '@/lib/constants';

export const alt = `${SITE_NAME} — Facturation, devis et gestion pour artisans et PME`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const logoData = await readFile(join(process.cwd(), 'public/logo-inveq.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 45%, #E0E7FF 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}>
        <img
          alt=""
          height={118}
          src={logoSrc}
          style={{ marginBottom: 40 }}
          width={440}
        />
        <p
          style={{
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 900,
            color: '#0F172A',
          }}>
          Gérez vos devis et factures comme un pro.
        </p>
        <p
          style={{
            fontSize: 24,
            marginTop: 20,
            color: '#475569',
            maxWidth: 800,
          }}>
          Facturation, signatures et paiements pour artisans, freelances et PME.
        </p>
      </div>
    ),
    { ...size },
  );
}
