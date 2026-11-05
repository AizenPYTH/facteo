/**
 * Relances : étapes et modèles par défaut. Copie fidèle de
 * `supabase/functions/_shared/email/reminder-email.ts` (ce que le serveur
 * envoie réellement quand aucun message personnalisé n'est saisi).
 */

export type ReminderStage = 'before_due' | 'due' | 'after_7' | 'after_15' | 'manual';
export type AutomaticReminderStage = Exclude<ReminderStage, 'manual'>;

export type ReminderTemplate = { subject: string; body: string };

export const AUTOMATIC_REMINDER_STAGES: AutomaticReminderStage[] = ['before_due', 'due', 'after_7', 'after_15'];

export const REMINDER_STAGE_LABELS: Record<ReminderStage, string> = {
  before_due: '3 jours avant l’échéance',
  due: 'Le jour de l’échéance',
  after_7: '7 jours après l’échéance',
  after_15: '15 jours après l’échéance',
  manual: 'Relance manuelle',
};

export const DEFAULT_REMINDER_TEMPLATES: Record<ReminderStage, ReminderTemplate> = {
  before_due: {
    subject: 'Rappel : facture {numero} à régler le {echeance}',
    body:
      'Bonjour {client},\n\nPetit rappel : la facture n° {numero} d’un montant de {montant} arrive à échéance le {echeance}.\n\nSi le règlement est déjà parti, merci de ne pas tenir compte de ce message.\n\nCordialement,\n{entreprise}',
  },
  due: {
    subject: 'Facture {numero} : échéance aujourd’hui',
    body:
      'Bonjour {client},\n\nLa facture n° {numero} arrive à échéance aujourd’hui. Le montant à régler est de {montant}.\n\nSi le règlement est déjà parti, merci de ne pas tenir compte de ce message.\n\nCordialement,\n{entreprise}',
  },
  after_7: {
    subject: 'Relance : facture {numero} en attente de règlement',
    body:
      'Bonjour {client},\n\nSauf erreur de notre part, la facture n° {numero}, échue le {echeance}, n’est pas encore réglée. Le montant restant dû est de {montant}.\n\nMerci de procéder au règlement dès que possible.\n\nCordialement,\n{entreprise}',
  },
  after_15: {
    subject: 'Second rappel : facture {numero} impayée',
    body:
      'Bonjour {client},\n\nMalgré notre précédent rappel, la facture n° {numero}, échue le {echeance}, reste impayée. Le montant restant dû est de {montant}.\n\nMerci de régulariser la situation rapidement ou de nous contacter en cas de difficulté.\n\nCordialement,\n{entreprise}',
  },
  manual: {
    subject: 'Relance : facture {numero}',
    body:
      'Bonjour {client},\n\nNous revenons vers vous au sujet de la facture n° {numero} (échéance : {echeance}). Le montant restant dû est de {montant}.\n\nCordialement,\n{entreprise}',
  },
};

export const REMINDER_PLACEHOLDERS_HELP =
  'Variables : {client}, {numero}, {montant} (reste dû), {echeance}, {entreprise}. Un lien vers la facture et, s’il existe, le lien de paiement sont ajoutés automatiquement.';

export const NEXT_REMINDER_REASONS: Record<string, string> = {
  REMINDERS_DISABLED: 'Relances automatiques désactivées dans les réglages.',
  INVOICE_REMINDERS_DISABLED: 'Relances désactivées pour cette facture.',
  NO_DUE_DATE: 'Pas de date d’échéance.',
  SCHEDULE_DONE: 'Toutes les relances prévues ont été envoyées.',
  INVOICE_PAID: 'Facture réglée : plus de relance.',
  INVOICE_CANCELED: 'Facture annulée : pas de relance.',
  INVOICE_DRAFT: 'Brouillon : envoyez la facture pour activer les relances.',
  INVOICE_DELETED: 'Facture supprimée.',
  NOT_AN_INVOICE: 'Un avoir ne se relance pas.',
  CLIENT_EMAIL_MISSING: 'Ajoutez l’e-mail du client pour pouvoir le relancer.',
  INVOICE_NOT_FOUND: 'Facture introuvable.',
};
