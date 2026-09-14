import type { Metadata } from 'next';

/**
 * Page de retour d'authentification, composant client : le `noindex` est porté
 * par ce layout, comme pour `/auth/confirmed`. Cette URL n'a aucun contenu à
 * offrir à un visiteur venu de la recherche.
 */
export const metadata: Metadata = {
  title: 'Confirmation du compte',
  robots: { index: false, follow: false },
};

export default function AuthConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
