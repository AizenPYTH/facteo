export function getCompanyProfileErrorMessage(message: string): string {
  switch (message) {
    case 'duplicate key value violates unique constraint "profiles_pkey"':
      return 'Ce profil existe déjà.';
    default:
      if (message.toLowerCase().includes('network')) {
        return 'Erreur réseau. Vérifiez votre connexion.';
      }

      return message || 'Une erreur est survenue lors de la sauvegarde.';
  }
}
