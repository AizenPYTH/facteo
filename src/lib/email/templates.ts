import type { SentDocumentType } from '@/types/sent-document';

type EmailTemplateInput = {
  documentType: SentDocumentType;
  documentNumber: string;
  clientName: string;
  companyName?: string;
  customMessage?: string;
};

type ReminderEmailInput = {
  documentNumber: string;
  clientName: string;
  companyName?: string;
  amountLabel?: string;
  dueAtLabel?: string | null;
  customMessage?: string;
};

/** Detect reminder rows in sent_documents without a schema column. */
export function isReminderSubject(subject: string): boolean {
  return /^relance\b/i.test(subject.trim());
}

export function buildEmailTemplate(input: EmailTemplateInput): {
  subject: string;
  body: string;
} {
  const company = input.companyName?.trim() || 'INVEQ';
  const greeting = `Bonjour ${input.clientName},`;

  if (input.documentType === 'quote') {
    return {
      subject: `Devis ${input.documentNumber} — ${company}`,
      body: [
        greeting,
        '',
        `Veuillez trouver ci-joint notre devis n° ${input.documentNumber}.`,
        input.customMessage?.trim() || 'Nous restons à votre disposition pour toute question.',
        '',
        'Cordialement,',
        company,
      ].join('\n'),
    };
  }

  return {
    subject: `Facture ${input.documentNumber} — ${company}`,
    body: [
      greeting,
      '',
      `Veuillez trouver ci-joint la facture n° ${input.documentNumber}.`,
      input.customMessage?.trim() || 'Merci de procéder au règlement selon les conditions indiquées.',
      '',
      'Cordialement,',
      company,
    ].join('\n'),
  };
}

/**
 * Payment reminder template — subject starts with "Relance" for history labeling.
 * Argument commercial: relancer un client en un geste depuis le chantier.
 */
export function buildReminderEmailTemplate(input: ReminderEmailInput): {
  subject: string;
  body: string;
} {
  const company = input.companyName?.trim() || 'INVEQ';
  const greeting = `Bonjour ${input.clientName},`;
  const amountLine = input.amountLabel
    ? `Montant restant dû : ${input.amountLabel}.`
    : null;
  const dueLine = input.dueAtLabel
    ? `Date d’échéance : ${input.dueAtLabel}.`
    : null;

  return {
    subject: `Relance — Facture ${input.documentNumber} — ${company}`,
    body: [
      greeting,
      '',
      `Sauf erreur de notre part, la facture n° ${input.documentNumber} reste en attente de règlement.`,
      amountLine,
      dueLine,
      '',
      input.customMessage?.trim() ||
        'Merci de procéder au paiement dans les meilleurs délais. Le PDF de la facture est joint à cet e-mail.',
      '',
      'Cordialement,',
      company,
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  };
}
