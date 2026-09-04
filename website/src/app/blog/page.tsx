import { redirect } from 'next/navigation';

/**
 * `/blog` annonçait des articles « bientôt disponibles » sans rien contenir,
 * tout en figurant au sitemap. Le contenu éditorial vit désormais sous
 * `/guides` ; on redirige plutôt que de laisser une page vide indexable, et
 * l'ancienne URL conserve sa valeur si elle était liée.
 */
export default function BlogRedirect() {
  redirect('/guides');
}
