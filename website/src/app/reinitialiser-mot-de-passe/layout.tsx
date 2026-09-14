import type { Metadata } from 'next';

/**
 * La page est un composant client : elle ne peut pas exporter `metadata`
 * elle-même. Ce layout porte donc le `noindex`.
 *
 * L'URL est déjà interdite dans robots.txt, mais un lien externe suffirait à la
 * faire apparaître dans l'index sous forme d'URL nue. Les autres écrans du
 * parcours de compte (`/login`, `/register`, `/mot-de-passe-oublie`) portent la
 * même directive.
 */
export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
