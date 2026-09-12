import {
  buildEmailContent,
  buildResendPayload,
  escapeHtml,
  isEmail,
  resolveClientName,
  sanitizeFileName,
} from './document-email.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('isEmail accepte une adresse valide et refuse le reste', () => {
  assert(isEmail('contact@martin.fr'), 'adresse valide refusée');
  assert(isEmail('  sophie.martin@exemple.co.uk  '), 'adresse avec espaces refusée');
  assert(!isEmail(''), 'chaîne vide acceptée');
  assert(!isEmail(null), 'null accepté');
  assert(!isEmail('martin.fr'), 'adresse sans @ acceptée');
  assert(!isEmail('a@b'), 'domaine sans extension accepté');
});

Deno.test('resolveClientName privilégie la raison sociale', () => {
  assert(resolveClientName('Martin & Fils', 'Martin, Sophie') === 'Martin & Fils', 'société ignorée');
});

Deno.test('resolveClientName remet « Nom, Prénom » dans l’ordre de lecture', () => {
  assert(resolveClientName(null, 'Martin, Sophie') === 'Sophie Martin', 'ordre non inversé');
  assert(resolveClientName('', 'Martin') === 'Martin', 'nom seul altéré');
  assert(resolveClientName(null, null) === 'Madame, Monsieur', 'repli manquant');
  assert(resolveClientName('   ', '  ') === 'Madame, Monsieur', 'repli manquant sur espaces');
});

Deno.test('sanitizeFileName produit toujours un .pdf sûr', () => {
  assert(sanitizeFileName('FAC 2026/0001', 'x.pdf') === 'FAC_2026_0001.pdf', 'caractères non assainis');
  assert(sanitizeFileName(null, 'FAC-1.pdf') === 'FAC-1.pdf', 'repli ignoré');
  assert(sanitizeFileName('  ', 'FAC-2') === 'FAC-2.pdf', 'extension non ajoutée');
});

Deno.test('escapeHtml neutralise le balisage saisi par l’utilisateur', () => {
  assert(escapeHtml('<script>x</script>') === '&lt;script&gt;x&lt;/script&gt;', 'balisage non échappé');
});

Deno.test('buildEmailContent distingue devis et facture', () => {
  const invoice = buildEmailContent({
    documentType: 'invoice',
    documentNumber: 'FAC-2026-0001',
    clientName: 'Sophie Martin',
    companyName: 'Électricité Dupont',
  });

  assert(invoice.subject === 'Facture FAC-2026-0001 — Électricité Dupont', 'sujet facture incorrect');
  assert(invoice.text.includes('Bonjour Sophie Martin,'), 'salutation absente');
  assert(invoice.text.includes('la facture n° FAC-2026-0001'), 'référence absente du texte');
  assert(invoice.html.includes('FAC-2026-0001'), 'référence absente du HTML');

  const quote = buildEmailContent({
    documentType: 'quote',
    documentNumber: 'DEV-2026-0007',
    clientName: 'Sophie Martin',
    companyName: 'Électricité Dupont',
  });

  assert(quote.subject.startsWith('Devis '), 'sujet devis incorrect');
  assert(quote.text.includes('notre devis n° DEV-2026-0007'), 'référence devis absente');
});

Deno.test('buildEmailContent échappe le nom du client dans le HTML', () => {
  const content = buildEmailContent({
    documentType: 'invoice',
    documentNumber: 'F1',
    clientName: '<b>Pirate</b>',
    companyName: 'ACME',
  });

  assert(!content.html.includes('<b>Pirate</b>'), 'injection HTML possible');
  assert(content.html.includes('&lt;b&gt;Pirate&lt;/b&gt;'), 'échappement absent');
});

Deno.test('buildResendPayload utilise l’expéditeur INVEQ et répond à l’entreprise', () => {
  const content = buildEmailContent({
    documentType: 'invoice',
    documentNumber: 'F1',
    clientName: 'Client',
    companyName: 'ACME',
  });

  const payload = buildResendPayload({
    fromName: 'INVEQ',
    fromAddress: 'factures@inveq.fr',
    recipientEmail: 'client@exemple.fr',
    replyTo: 'contact@acme.fr',
    content,
    fileName: 'F1.pdf',
    pdfBase64: 'QkFTRTY0',
  }) as Record<string, unknown>;

  assert(payload.from === 'INVEQ <factures@inveq.fr>', 'expéditeur incorrect');
  assert(JSON.stringify(payload.to) === JSON.stringify(['client@exemple.fr']), 'destinataire incorrect');
  assert(payload.reply_to === 'contact@acme.fr', 'reply_to absent');

  const attachments = payload.attachments as { filename: string; content: string }[];
  assert(attachments.length === 1, 'pièce jointe manquante');
  assert(attachments[0].filename === 'F1.pdf', 'nom de pièce jointe incorrect');
  assert(attachments[0].content === 'QkFTRTY0', 'contenu de pièce jointe incorrect');
});

Deno.test('buildResendPayload omet reply_to quand l’entreprise n’a pas d’e-mail', () => {
  const content = buildEmailContent({
    documentType: 'quote',
    documentNumber: 'D1',
    clientName: 'Client',
    companyName: 'ACME',
  });

  const withoutReply = buildResendPayload({
    fromName: 'INVEQ',
    fromAddress: 'factures@inveq.fr',
    recipientEmail: 'client@exemple.fr',
    replyTo: '',
    content,
    fileName: 'D1.pdf',
    pdfBase64: 'QkFTRTY0',
  }) as Record<string, unknown>;

  assert(!('reply_to' in withoutReply), 'reply_to vide transmis à Resend');
});
