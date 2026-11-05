import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Image, Platform, Pressable, Share, Text, View } from 'react-native';

import { SectionHeader } from '@/components/dashboard/section-header';
import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/datetime';
import {
  createDocumentShareLink,
  fetchDocumentShareActivity,
  fetchQuoteAcceptances,
  revokeDocumentShareLinks,
  type QuoteAcceptance,
  type ShareableDocumentType,
} from '@/lib/supabase/document-links';
import { invoicesQueryKeys, quotesQueryKeys } from '@/lib/supabase/query-keys';
import { useToast } from '@/providers/toast-provider';

type ClientLinkSectionProps = {
  documentType: ShareableDocumentType;
  documentId: string;
  documentNumber: string;
  status: string;
};

/**
 * Lien sécurisé à envoyer au client (mêmes liens que sur le site) : il
 * consulte le document, le télécharge et, pour un devis, le signe en ligne.
 * Affiche aussi la preuve de la réponse du client.
 */
export function ClientLinkSection({ documentType, documentId, documentNumber, status }: ClientLinkSectionProps) {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [proofOpen, setProofOpen] = useState(false);

  const activityQuery = useQuery({
    queryKey: ['document-share-activity', documentType, documentId],
    queryFn: () => fetchDocumentShareActivity(documentType, documentId),
    enabled: Boolean(documentId),
  });
  const acceptancesQuery = useQuery({
    queryKey: ['quote-acceptances', documentId],
    queryFn: () => fetchQuoteAcceptances(documentId),
    enabled: documentType === 'quote' && Boolean(documentId),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['document-share-activity', documentType, documentId] });
    void queryClient.invalidateQueries({
      queryKey: documentType === 'quote' ? quotesQueryKeys.all : invoicesQueryKeys.all,
    });
  };

  const shareMutation = useMutation({
    mutationFn: () => createDocumentShareLink(documentType, documentId),
    onSuccess: async (url) => {
      refresh();
      const label = documentType === 'quote' ? `le devis ${documentNumber}` : `la facture ${documentNumber}`;
      const message =
        documentType === 'quote'
          ? `Bonjour, voici ${label}. Vous pouvez le consulter et le signer en ligne : ${url}`
          : `Bonjour, voici ${label}. Vous pouvez la consulter en ligne : ${url}`;
      try {
        await Share.share(Platform.OS === 'ios' ? { message, url } : { message });
      } catch {
        showSuccess('Lien créé.');
      }
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Impossible de créer le lien.'),
  });

  const revokeMutation = useMutation({
    mutationFn: () => revokeDocumentShareLinks(documentType, documentId),
    onSuccess: (count) => {
      refresh();
      showSuccess(count > 0 ? 'Les liens envoyés ne fonctionnent plus.' : 'Aucun lien actif.');
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  const activity = activityQuery.data;
  const answer = acceptancesQuery.data?.[0] ?? null;
  const canShare = !(documentType === 'invoice' && status === 'canceled');

  return (
    <View style={styles.section}>
      <SectionHeader title={documentType === 'quote' ? 'Signature en ligne' : 'Lien client'} />
      <View style={styles.card}>
        {answer ? (
          <AnswerProof answer={answer} open={proofOpen} onToggle={() => setProofOpen((value) => !value)} />
        ) : null}

        {documentType === 'quote' && !answer && status === 'accepted' ? (
          <Text style={styles.note}>
            Accepté manuellement : aucune signature en ligne n’est enregistrée pour ce devis.
          </Text>
        ) : null}

        {canShare ? (
          <>
            <Text style={styles.body}>
              {documentType === 'quote'
                ? 'Envoyez un lien à votre client : il consulte le devis, le télécharge, puis l’accepte en signant ou le refuse.'
                : 'Envoyez un lien à votre client : il consulte la facture, la télécharge et la règle en ligne si un lien de paiement existe.'}
            </Text>
            <Button
              loading={shareMutation.isPending}
              onPress={() => shareMutation.mutate()}
              title="Partager le lien client"
            />
            {activity && activity.activeLinks > 0 ? (
              <Button
                loading={revokeMutation.isPending}
                onPress={() => revokeMutation.mutate()}
                title="Désactiver les liens envoyés"
                variant="ghost"
              />
            ) : null}
            {activity ? (
              <Text style={styles.meta}>
                {activity.lastViewedAt
                  ? `Ouvert ${activity.totalViews} fois · dernière fois le ${formatDateTime(activity.lastViewedAt)}`
                  : activity.activeLinks > 0
                    ? 'Pas encore ouvert par le client.'
                    : 'Aucun lien envoyé.'}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.body}>Une facture annulée ne peut pas être partagée.</Text>
        )}
      </View>
    </View>
  );
}

function AnswerProof({ answer, open, onToggle }: { answer: QuoteAcceptance; open: boolean; onToggle: () => void }) {
  const styles = useStyles();
  const accepted = answer.decision === 'accepted';
  return (
    <View style={[styles.proof, accepted ? styles.proofAccepted : null]}>
      <Text style={styles.proofTitle}>
        {accepted ? 'Signé en ligne' : 'Refusé en ligne'} par {answer.signerName}
      </Text>
      <Text style={styles.meta}>
        Le {formatDateTime(answer.createdAt)} · {formatCurrency(answer.totalTtc)} TTC
      </Text>
      {answer.comment ? <Text style={styles.body}>« {answer.comment} »</Text> : null}
      {answer.signatureImage ? (
        <Image
          accessibilityLabel={`Signature de ${answer.signerName}`}
          resizeMode="contain"
          source={{ uri: answer.signatureImage }}
          style={styles.signature}
        />
      ) : null}
      <Pressable accessibilityRole="button" onPress={onToggle}>
        <Text style={styles.link}>{open ? 'Masquer la preuve' : 'Voir la preuve du consentement'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.proofDetails}>
          {answer.consentText ? <Text style={styles.meta}>Texte accepté : {answer.consentText}</Text> : null}
          {answer.signerEmail ? <Text style={styles.meta}>E-mail : {answer.signerEmail}</Text> : null}
          <Text style={styles.meta}>Adresse IP : {answer.ipAddress ?? 'non transmise'}</Text>
          <Text style={styles.meta}>Navigateur : {answer.userAgent ?? 'non transmis'}</Text>
          <Text selectable style={styles.meta}>
            Empreinte SHA-256 du devis signé : {answer.documentHash}
          </Text>
          <Text style={styles.meta}>Signature électronique simple (art. 1367 du Code civil), non qualifiée.</Text>
        </View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    body: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    note: {
      ...typography.footnote,
      color: colors.textSecondary,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: radius.card,
      padding: spacing.sm,
    },
    meta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    proof: {
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    proofAccepted: {
      borderColor: colors.success,
    },
    proofTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    signature: {
      height: 64,
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 6,
    },
    link: {
      ...typography.footnote,
      color: colors.primary,
      paddingVertical: spacing.xs,
    },
    proofDetails: {
      gap: spacing.xs,
    },
  }));
}
