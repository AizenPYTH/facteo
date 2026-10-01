/**
 * Vocabulaire d'un modèle.
 *
 * Tous les modèles disaient « Émetteur », « Facturé à », « Désignation »,
 * « Net à payer » : deux factures INVEQ se reconnaissaient au premier coup
 * d'œil, quelle que soit leur mise en page. Chaque modèle choisit désormais
 * un registre de langue. Tous restent conformes : HT, TVA et TTC, dates
 * d'émission et d'échéance y figurent toujours, seuls les mots changent.
 */
export type VocabularyId =
  | 'classic'
  | 'corporate'
  | 'friendly'
  | 'retail'
  | 'formal'
  | 'minimal'
  | 'craft'
  | 'studio'
  | 'ledger';

export type Vocabulary = {
  issuer: string;
  billedTo: string;
  designation: string;
  quantity: string;
  unitPrice: string;
  vat: string;
  totalHt: string;
  amountDue: string;
  payment: string;
  issuedAt: string;
  dueDate: string;
  conditions: string;
  subtotal: string;
  discount: string;
  /** Libellé des totaux (« Total HT », « Montant hors taxes »…). */
  totalHtRow: string;
  vatRow: (rate: string) => string;
  paymentTerms: (days: number) => string;
  settled: string;
  /** Devis : destinataire, total et validité. */
  quoteBilledTo: string;
  quoteAmount: string;
  quoteValidity: string;
};

const BASE: Vocabulary = {
  issuer: 'Émetteur',
  billedTo: 'Facturé à',
  designation: 'Désignation',
  quantity: 'Qté',
  unitPrice: 'P.U. HT',
  vat: 'TVA',
  totalHt: 'Total HT',
  amountDue: 'Net à payer',
  payment: 'Règlement',
  issuedAt: "Date d'émission",
  dueDate: 'Échéance',
  conditions: 'Conditions',
  subtotal: 'Sous-total HT',
  discount: 'Remise',
  totalHtRow: 'Total HT',
  vatRow: (rate) => `TVA ${rate}`,
  paymentTerms: (days) => `Paiement sous ${days} jours`,
  settled: 'Facture payée — aucun règlement attendu',
  quoteBilledTo: 'Destinataire',
  quoteAmount: 'Total du devis',
  quoteValidity: 'Validité',
};

export const VOCABULARIES: Record<VocabularyId, Vocabulary> = {
  classic: BASE,
  corporate: {
    ...BASE,
    issuer: 'Prestataire',
    billedTo: 'Client',
    designation: 'Description',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire HT',
    totalHt: 'Montant HT',
    amountDue: 'Total à régler',
    payment: 'Modalités de paiement',
    issuedAt: 'Date de facture',
    dueDate: 'Date limite de paiement',
    conditions: 'Modalités',
    totalHtRow: 'Montant HT',
    vatRow: (rate) => `TVA (${rate})`,
    paymentTerms: (days) => `Règlement à ${days} jours date de facture`,
    settled: 'Réglée — aucun paiement attendu',
    quoteBilledTo: 'Client',
    quoteAmount: 'Montant de la proposition',
    quoteValidity: 'Offre valable jusqu’au',
  },
  friendly: {
    ...BASE,
    issuer: 'De',
    billedTo: 'Pour',
    designation: 'Ce qui a été fait',
    quantity: 'Qté',
    unitPrice: 'Prix',
    totalHt: 'Montant',
    amountDue: 'À régler',
    payment: 'Comment payer',
    issuedAt: 'Émise le',
    dueDate: 'À payer avant le',
    conditions: 'Délai',
    totalHtRow: 'Total hors taxes',
    paymentTerms: (days) => `${days} jours pour régler`,
    settled: 'Déjà payée, merci !',
    quoteBilledTo: 'Pour',
    quoteAmount: 'Total proposé',
    quoteValidity: 'Valable jusqu’au',
  },
  retail: {
    ...BASE,
    issuer: 'Vendeur',
    billedTo: 'Acheteur',
    designation: 'Article',
    quantity: 'Qté',
    unitPrice: 'Prix unit. HT',
    totalHt: 'Total HT',
    amountDue: 'Montant dû',
    payment: 'Mode de règlement',
    issuedAt: 'Date de vente',
    dueDate: 'Payable le',
    conditions: 'Conditions',
    totalHtRow: 'Total articles HT',
    vatRow: (rate) => `dont TVA ${rate}`,
    settled: 'Payé — merci de votre achat',
    quoteBilledTo: 'Acheteur',
    quoteAmount: 'Total estimé',
  },
  formal: {
    ...BASE,
    issuer: 'Émetteur de la facture',
    billedTo: 'Adressée à',
    designation: 'Nature des prestations',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire hors taxes',
    totalHt: 'Total hors taxes',
    amountDue: 'Somme due',
    payment: 'Règlement',
    issuedAt: 'Établie le',
    dueDate: 'Exigible le',
    conditions: 'Conditions de règlement',
    subtotal: 'Total brut hors taxes',
    discount: 'Rabais',
    totalHtRow: 'Total hors taxes',
    vatRow: (rate) => `Taxe sur la valeur ajoutée (${rate})`,
    paymentTerms: (days) => `Règlement à ${days} jours`,
    settled: 'Acquittée — somme réglée en totalité',
    quoteBilledTo: 'Adressé à',
    quoteAmount: 'Montant total du devis',
    quoteValidity: 'Devis valable jusqu’au',
  },
  minimal: {
    ...BASE,
    issuer: 'De',
    billedTo: 'À',
    designation: 'Objet',
    quantity: 'Qté',
    unitPrice: 'Prix',
    totalHt: 'HT',
    amountDue: 'Dû',
    payment: 'Paiement',
    issuedAt: 'Date',
    dueDate: 'Échéance',
    conditions: 'Délai',
    totalHtRow: 'HT',
    vatRow: (rate) => `TVA ${rate}`,
    paymentTerms: (days) => `${days} j`,
    settled: 'Payée',
    quoteBilledTo: 'À',
    quoteAmount: 'Total',
  },
  craft: {
    ...BASE,
    issuer: 'L’artisan',
    billedTo: 'Chez',
    designation: 'Travaux réalisés',
    quantity: 'Qté',
    unitPrice: 'Prix unitaire HT',
    totalHt: 'Montant HT',
    amountDue: 'Reste à payer',
    payment: 'Règlement',
    issuedAt: 'Fait le',
    dueDate: 'À régler pour le',
    conditions: 'Paiement',
    totalHtRow: 'Total des travaux HT',
    paymentTerms: (days) => `À réception, au plus tard sous ${days} jours`,
    settled: 'Soldée — merci pour votre confiance',
    quoteBilledTo: 'Chez',
    quoteAmount: 'Montant des travaux',
    quoteValidity: 'Devis valable jusqu’au',
  },
  studio: {
    ...BASE,
    issuer: 'Studio',
    billedTo: 'Projet pour',
    designation: 'Livrables',
    quantity: 'Unités',
    unitPrice: 'Tarif HT',
    totalHt: 'Sous-total',
    amountDue: 'Total dû',
    payment: 'Paiement',
    issuedAt: 'Facturé le',
    dueDate: 'Dû le',
    conditions: 'Termes',
    totalHtRow: 'Total HT',
    paymentTerms: (days) => `Net ${days}`,
    settled: 'Réglé',
    quoteBilledTo: 'Projet pour',
    quoteAmount: 'Budget',
    quoteValidity: 'Proposition valable jusqu’au',
  },
  ledger: {
    ...BASE,
    issuer: 'Fournisseur',
    billedTo: 'Débiteur',
    designation: 'Libellé',
    quantity: 'Qté',
    unitPrice: 'PU HT',
    totalHt: 'Montant HT',
    amountDue: 'Solde à payer',
    payment: 'Règlement',
    issuedAt: 'Date de pièce',
    dueDate: 'Date d’exigibilité',
    conditions: 'Délai de règlement',
    totalHtRow: 'Base HT',
    vatRow: (rate) => `TVA collectée ${rate}`,
    settled: 'Soldée',
    quoteBilledTo: 'Client',
    quoteAmount: 'Montant estimé TTC',
  },
};

export function resolveVocabulary(id: VocabularyId | undefined): Vocabulary {
  return VOCABULARIES[id ?? 'classic'] ?? BASE;
}
