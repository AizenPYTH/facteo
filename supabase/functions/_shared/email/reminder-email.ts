/**
 * Relances de factures : modèles par défaut et mise en forme (logique pure,
 * testable sans réseau). Les mêmes modèles par défaut sont affichés dans les
 * réglages du site et de l'application.
 */

import { escapeHtml, safeHttpsUrl } from './document-email.ts';

export type ReminderStage = 'before_due' | 'due' | 'after_7' | 'after_15' | 'manual';

export type ReminderTemplate = { subject: string; body: string };

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

export type ReminderValues = {
  client: string;
  numero: string;
  montant: string;
  echeance: string;
  entreprise: string;
};

const MAX_SUBJECT = 200;
const MAX_BODY = 5000;

function fill(template: string, values: ReminderValues): string {
  return template.replace(/\{(client|numero|montant|echeance|entreprise)\}/g, (_, key: keyof ReminderValues) => values[key]);
}

/** Modèle personnalisé s'il est rempli, sinon le modèle par défaut. */
export function resolveReminderTemplate(stage: ReminderStage, custom: unknown): ReminderTemplate {
  const fallback = DEFAULT_REMINDER_TEMPLATES[stage];
  const source = custom && typeof custom === 'object' ? (custom as Record<string, unknown>)[stage] : null;
  const entry = source && typeof source === 'object' ? (source as Record<string, unknown>) : {};
  const subject = typeof entry.subject === 'string' && entry.subject.trim() ? entry.subject.trim() : fallback.subject;
  const body = typeof entry.body === 'string' && entry.body.trim() ? entry.body.trim() : fallback.body;
  return { subject: subject.slice(0, MAX_SUBJECT), body: body.slice(0, MAX_BODY) };
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

export function formatFrenchDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(
    new Date(value),
  );
}

export function buildReminderEmail(params: {
  stage: ReminderStage;
  templates: unknown;
  values: ReminderValues;
  documentUrl: string | null;
  paymentUrl: string | null;
}): { subject: string; text: string; html: string } {
  const template = resolveReminderTemplate(params.stage, params.templates);
  // Une ligne de sujet, sans retour à la ligne (en-tête d'e-mail).
  const subject = fill(template.subject, params.values).replace(/[\r\n]+/g, ' ').slice(0, MAX_SUBJECT);
  const body = fill(template.body, params.values);
  const documentUrl = safeHttpsUrl(params.documentUrl);
  const paymentUrl = safeHttpsUrl(params.paymentUrl);

  const text = [
    body,
    ...(documentUrl ? ['', `Consulter la facture : ${documentUrl}`] : []),
    ...(paymentUrl ? [`Payer en ligne : ${paymentUrl}`] : []),
  ].join('\n');

  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px;">${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
    .join('');
  const button = (href: string, label: string, primary: boolean) =>
    `<a href="${escapeHtml(href)}" style="${
      primary ? 'background:#4f46e5;color:#ffffff;' : 'background:#ffffff;color:#4f46e5;border:1px solid #c7d2fe;'
    }display:inline-block;padding:12px 18px;border-radius:10px;font-weight:600;text-decoration:none;margin:0 8px 8px 0;">${escapeHtml(label)}</a>`;
  const buttons = [
    paymentUrl ? button(paymentUrl, `Payer ${params.values.montant}`, true) : '',
    documentUrl ? button(documentUrl, 'Consulter la facture', !paymentUrl) : '',
  ].join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1c1e;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;">
      ${paragraphs}
      ${buttons ? `<div style="margin:8px 0 0;">${buttons}</div>` : ''}
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
