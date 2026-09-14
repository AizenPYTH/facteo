import { permanentRedirect } from 'next/navigation';

/**
 * Alias anglais historique → page CGU canonique.
 *
 * `permanentRedirect` (308) et non `redirect` (307) : un 307 dit à Google de
 * conserver l'ancienne URL dans son index, où elle reste signalée « Page avec
 * redirection ». Le 308 demande le remplacement définitif par la cible et lui
 * transfère l'ancienneté des liens qui pointent encore vers l'alias.
 */
export default function TermsRedirect() {
  permanentRedirect('/conditions-utilisation');
}
