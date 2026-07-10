export function getProductErrorMessage(message: string): string {
  switch (message) {
    case 'User must be authenticated to create a product.':
      return 'Vous devez être connecté pour effectuer cette action.';
    default:
      if (message.toLowerCase().includes('network')) {
        return 'Erreur réseau. Vérifiez votre connexion.';
      }

      return message || 'Une erreur est survenue.';
  }
}
