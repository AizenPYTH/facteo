export function getQuoteErrorMessage(message: string): string {
  switch (message) {
    case 'User must be authenticated to create a quote.':
      return 'Vous devez être connecté pour effectuer cette action.';
    case 'Quote must have at least one line.':
      return 'Ajoutez au moins une ligne au devis.';
    case 'Client is required.':
      return 'Sélectionnez un client.';
    default:
      if (message.toLowerCase().includes('network')) {
        return 'Erreur réseau. Vérifiez votre connexion.';
      }

      if (message.includes('duplicate key') || message.includes('quotes_user_id_number_key')) {
        return 'Numéro de devis déjà utilisé. Réessayez.';
      }

      return message || 'Une erreur est survenue.';
  }
}
