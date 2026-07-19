import type { SentDocumentType } from '@/types/sent-document';

type EmailTemplateInput = {
  documentType: SentDocumentType;
  documentNumber: string;
  clientName: string;
  companyName?: string;
  customMessage?: string;
};

export function buildEmailTemplate(input: EmailTemplateInput): {
  subject: string;
  body: string;
} {
  const company = input.companyName?.trim() || 'Factume';
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
