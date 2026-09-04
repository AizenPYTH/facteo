import { permanentRedirect } from 'next/navigation';

/**
 * `/fonctionnalites` décrivait le produit avec les deux mêmes sections que
 * `/logiciel-facturation`, qui en compte cinq de plus. Deux pages répondant à
 * la même intention se seraient concurrencées sans mieux renseigner personne :
 * on consolide sur la page pivot plutôt que de diviser le signal.
 *
 * La redirection conserve la valeur de l'ancienne URL si elle était liée, et le
 * visiteur arrive sur un contenu qui englobe celui qu'il cherchait.
 *
 * `permanentRedirect` et non `redirect` : le 308 demande la substitution de
 * l'URL dans l'index, là où le 307 laisserait les deux coexister.
 */
export default function FonctionnalitesRedirect() {
  permanentRedirect('/logiciel-facturation');
}
