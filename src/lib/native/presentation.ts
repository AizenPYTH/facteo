/**
 * Une seule vue native présentée à la fois, pour toute l'application.
 *
 * iOS n'autorise qu'une vue présentée par écran. Imprimer, partager,
 * enregistrer, ouvrir l'app Mail, choisir une photo, ouvrir une session web —
 * chacune présente un contrôleur natif par-dessus l'application. En présenter
 * un second pendant que le premier se ferme lève une exception côté système,
 * et une exception native **fait tomber l'application** : contrairement à une
 * erreur JavaScript, elle n'est rattrapable nulle part.
 *
 * Le piège tient au moment où la promesse se résout. `Print.printAsync` rend la
 * main dès que l'impression est LANCÉE, pas quand la fenêtre a fini de
 * disparaître ; `launchImageLibraryAsync` de même. Imprimer, revenir, puis
 * réimprimer aussitôt présentait donc le second contrôleur pendant l'animation
 * de sortie du premier : le premier appui marchait, le second faisait crasher.
 *
 * Le verrou est unique et global — pas un par action — puisque la contrainte
 * d'iOS l'est aussi : elle interdit tout autant d'imprimer pendant un partage
 * que d'imprimer deux fois. Un délai de retombée suit chaque présentation,
 * le temps que l'animation se termine réellement.
 */

/**
 * Durée d'animation de fermeture d'une vue modale iOS, avec une marge.
 * Apple compte environ 300 ms ; on prend le double pour couvrir un appareil
 * chargé ou une animation ralentie par l'accessibilité.
 */
const SETTLE_MS = 650;

let queue: Promise<unknown> = Promise.resolve();

function settle(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sérialise une présentation native.
 *
 * L'erreur de la tâche est propagée à l'appelant, mais ne rompt jamais la file :
 * une présentation ratée ne doit pas laisser le verrou fermé et bloquer toutes
 * les suivantes.
 */
export async function presentNatively<T>(task: () => Promise<T>): Promise<T> {
  const previous = queue.catch(() => undefined);

  const current = previous.then(async () => {
    try {
      return await task();
    } finally {
      await settle(SETTLE_MS);
    }
  });

  queue = current.catch(() => undefined);

  return current;
}

/** Réinitialise la file. Réservé aux tests. */
export function resetNativePresentationQueue(): void {
  queue = Promise.resolve();
}
