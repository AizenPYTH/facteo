import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { IOS_APP_NAME, IOS_APP_STORE_URL, IOS_MIN_VERSION } from '@/lib/constants';

/**
 * QR code généré à la compilation (composant serveur, page statique) :
 * le SVG est inliné, aucun service tiers ni dépendance côté navigateur.
 */
async function renderQrSvg(url: string) {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    // Quiet zone de 4 modules, recommandée par la spécification QR.
    margin: 4,
    color: { dark: '#0b0e14', light: '#ffffff' },
  });
}

export async function AppStoreQrSection() {
  const qrSvg = await renderQrSvg(IOS_APP_STORE_URL);

  return (
    <FadeIn className="mt-16 rounded-2xl border border-border bg-surface p-8">
      <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:gap-10 md:text-left">
        <div className="hidden shrink-0 md:block">
          <div
            aria-hidden
            className="h-[180px] w-[180px] overflow-hidden rounded-2xl border border-border bg-white [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <span className="sr-only">
            QR code renvoyant vers la fiche App Store de {IOS_APP_NAME}. Le même lien est
            disponible via le bouton « Télécharger sur l’App Store ».
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-foreground">
            L’application iPhone est disponible
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            <span className="hidden md:inline">
              Scannez ce QR code avec l’appareil photo de votre iPhone pour ouvrir la fiche App
              Store de {IOS_APP_NAME}.
            </span>
            <span className="md:hidden">
              Ouvrez la fiche App Store de {IOS_APP_NAME} directement depuis votre iPhone.
            </span>
          </p>
          <p className="mt-2 text-sm text-muted">iOS {IOS_MIN_VERSION} minimum.</p>
          <div className="mt-6 flex justify-center md:justify-start">
            <Button external href={IOS_APP_STORE_URL}>
              Télécharger sur l’App Store
            </Button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
