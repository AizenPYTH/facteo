import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

import { BatchConfirmModal } from '@/components/ui/batch-confirm-modal';
import { SelectionActionBar, type SelectionAction } from '@/components/ui/selection-action-bar';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { canRemindInvoice, remindInvoiceByMail } from '@/lib/invoices/remind';
import { generateInvoicePdfFile, shareInvoicePdf } from '@/lib/pdf/invoice-pdf';
import { sharePdf } from '@/lib/pdf/share';
import { fetchInvoiceById } from '@/lib/supabase/invoices';
import { triggerFeedbackHaptic } from '@/lib/haptics';
import { useToast } from '@/providers/toast-provider';
import {
  canDeleteInvoice,
  canMarkInvoiceAsPaid,
  type Invoice,
} from '@/types/invoice';

type ConfirmKind = 'paid' | 'delete' | null;

type InvoiceBatchBarProps = {
  invoices: Invoice[];
  selectedIds: string[];
  allSelected: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onExit: () => void;
};

export function InvoiceBatchBar({
  invoices,
  selectedIds,
  allSelected,
  onSelectAll,
  onClear,
  onExit,
}: InvoiceBatchBarProps) {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const { scope } = useTenant();
  const { data: companyProfile } = useCompanyProfile();
  const { markAsPaid, deleteInvoice } = useInvoiceMutations();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => invoices.filter((invoice) => selectedIds.includes(invoice.id)),
    [invoices, selectedIds],
  );

  const payable = selected.filter((invoice) => canMarkInvoiceAsPaid(invoice.status));
  const remindable = selected.filter((invoice) => canRemindInvoice(invoice));
  const deletable = selected.filter((invoice) => canDeleteInvoice(invoice.status));
  const shareable = selected.filter((invoice) => invoice.status !== 'draft');
  const missingEmail = selected.filter(
    (invoice) => canMarkInvoiceAsPaid(invoice.status) && !invoice.clientEmail?.trim(),
  );

  async function runSettled<T>(
    items: T[],
    runner: (item: T) => Promise<unknown>,
  ): Promise<{ ok: number; failed: number }> {
    const results = await Promise.allSettled(items.map((item) => runner(item)));
    const ok = results.filter((result) => result.status === 'fulfilled').length;
    return { ok, failed: results.length - ok };
  }

  async function handleMarkPaid() {
    setLoading(true);
    try {
      const { ok, failed } = await runSettled(payable, (invoice) =>
        markAsPaid.mutateAsync({ invoiceId: invoice.id }),
      );
      void triggerFeedbackHaptic(failed === 0 ? 'success' : 'error');
      if (ok > 0) {
        showSuccess(
          ok === 1 ? '1 facture marquée comme payée.' : `${ok} factures marquées comme payées.`,
        );
      }
      if (failed > 0) {
        showError(`${failed} facture${failed > 1 ? 's' : ''} n’ont pas pu être marquées payées.`);
      }
      onExit();
    } catch {
      showError('Impossible de marquer les factures comme payées.');
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  async function handleDeleteDrafts() {
    setLoading(true);
    try {
      const { ok, failed } = await runSettled(deletable, (invoice) =>
        deleteInvoice.mutateAsync(invoice.id),
      );
      void triggerFeedbackHaptic(failed === 0 ? 'success' : 'error');
      if (ok > 0) {
        showSuccess(ok === 1 ? '1 brouillon supprimé.' : `${ok} brouillons supprimés.`);
      }
      if (failed > 0) {
        showError(`${failed} brouillon${failed > 1 ? 's' : ''} n’ont pas pu être supprimés.`);
      }
      onExit();
    } catch {
      showError('Impossible de supprimer les brouillons.');
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  async function handleRemind() {
    if (!user?.id) {
      showError('Connectez-vous pour relancer.');
      return;
    }

    if (remindable.length === 0) {
      showError(
        missingEmail.length > 0
          ? 'Ajoutez un e-mail aux clients sélectionnés pour relancer.'
          : 'Aucune facture relançable dans la sélection.',
      );
      return;
    }

    setLoading(true);
    try {
      const resolved = requireScope(scope);
      let ok = 0;
      let failed = 0;

      for (const [index, invoice] of remindable.entries()) {
        try {
          await remindInvoiceByMail({
            scope: resolved,
            userId: user.id,
            invoiceId: invoice.id,
            companyName: companyProfile?.companyName,
            authEmail: user.email,
          });
          ok += 1;
          if (index < remindable.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        } catch {
          failed += 1;
        }
      }

      void triggerFeedbackHaptic(failed === 0 ? 'success' : 'error');
      if (ok > 0) {
        showSuccess(ok === 1 ? '1 relance ouverte.' : `${ok} relances ouvertes.`);
      }
      if (failed > 0) {
        showError(`${failed} relance${failed > 1 ? 's' : ''} n’ont pas pu être préparées.`);
      }
      if (missingEmail.length > 0) {
        showError(
          `${missingEmail.length} facture${missingEmail.length > 1 ? 's' : ''} sans e-mail client ignorée${missingEmail.length > 1 ? 's' : ''}.`,
        );
      }
      onExit();
    } catch {
      showError('Impossible de préparer les relances.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSharePdfs() {
    if (shareable.length === 0) {
      showError('Sélectionnez des factures finalisées (pas des brouillons).');
      return;
    }

    setLoading(true);
    try {
      const resolved = requireScope(scope);
      let ok = 0;
      let failed = 0;

      for (const [index, invoice] of shareable.entries()) {
        try {
          const detail = await fetchInvoiceById(resolved, invoice.id);
          if (!detail) {
            failed += 1;
            continue;
          }

          if (Platform.OS === 'web') {
            const file = await generateInvoicePdfFile(resolved, detail, user?.email);
            await sharePdf(file.uri, `Facture ${detail.number}`);
          } else {
            await shareInvoicePdf(resolved, detail, user?.email);
          }

          ok += 1;
          if (index < shareable.length - 1) {
            // Brief pause so native share sheets can dismiss cleanly.
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        } catch {
          failed += 1;
        }
      }

      void triggerFeedbackHaptic(failed === 0 ? 'success' : 'error');
      if (ok > 0) {
        showSuccess(ok === 1 ? '1 PDF partagé.' : `${ok} PDF partagés.`);
      }
      if (failed > 0) {
        showError(`${failed} PDF n’ont pas pu être générés.`);
      }
      onExit();
    } catch {
      showError('Partage PDF impossible.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdfs() {
    if (selected.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const resolved = requireScope(scope);
      const canShare = await Sharing.isAvailableAsync();
      let ok = 0;
      let failed = 0;

      for (const invoice of selected) {
        try {
          const detail = await fetchInvoiceById(resolved, invoice.id);
          if (!detail) {
            failed += 1;
            continue;
          }

          const file = await generateInvoicePdfFile(resolved, detail, user?.email);
          if (canShare) {
            await sharePdf(file.uri, `Télécharger ${detail.number}`);
          }
          ok += 1;
        } catch {
          failed += 1;
        }
      }

      void triggerFeedbackHaptic(failed === 0 ? 'success' : 'error');
      if (ok > 0) {
        showSuccess(ok === 1 ? '1 PDF prêt.' : `${ok} PDF prêts.`);
      }
      if (failed > 0) {
        showError(`${failed} PDF n’ont pas pu être générés.`);
      }
      onExit();
    } catch {
      showError('Téléchargement PDF impossible.');
    } finally {
      setLoading(false);
    }
  }

  const actions: SelectionAction[] = [
    {
      key: 'remind',
      label: remindable.length > 0 ? `Relancer (${remindable.length})` : 'Relancer',
      icon: { ios: 'bell.badge.fill', android: 'notifications_active', web: 'notifications_active' },
      disabled: remindable.length === 0,
      onPress: () => {
        void handleRemind();
      },
    },
    {
      key: 'paid',
      label: payable.length > 0 ? `Payées (${payable.length})` : 'Payées',
      icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
      disabled: payable.length === 0,
      onPress: () => setConfirm('paid'),
    },
    {
      key: 'pdf',
      label: 'PDF',
      icon: { ios: 'arrow.down.doc.fill', android: 'download', web: 'download' },
      disabled: selected.length === 0,
      onPress: () => {
        void handleDownloadPdfs();
      },
    },
    {
      key: 'share',
      label: 'Partager',
      icon: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
      disabled: shareable.length === 0,
      onPress: () => {
        void handleSharePdfs();
      },
    },
    {
      key: 'delete',
      label: deletable.length > 0 ? `Suppr. (${deletable.length})` : 'Suppr.',
      icon: { ios: 'trash.fill', android: 'delete', web: 'delete' },
      disabled: deletable.length === 0,
      destructive: true,
      onPress: () => setConfirm('delete'),
    },
  ];

  return (
    <>
      <SelectionActionBar
        actions={actions}
        allSelected={allSelected}
        loading={loading}
        onClear={onExit}
        onSelectAll={allSelected ? onClear : onSelectAll}
        selectedCount={selectedIds.length}
      />

      <BatchConfirmModal
        confirmLabel="Marquer payées"
        loading={loading}
        message={
          payable.length === 1
            ? `La facture ${payable[0]?.number} sera marquée comme entièrement payée.`
            : `${payable.length} factures seront marquées comme entièrement payées.`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void handleMarkPaid();
        }}
        title="Marquer comme payées ?"
        visible={confirm === 'paid'}
      />

      <BatchConfirmModal
        confirmLabel="Supprimer"
        destructive
        loading={loading}
        message={
          deletable.length === 1
            ? `Le brouillon ${deletable[0]?.number} sera définitivement supprimé.`
            : `${deletable.length} brouillons seront définitivement supprimés. Cette action est irréversible.`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void handleDeleteDrafts();
        }}
        title="Supprimer les brouillons ?"
        visible={confirm === 'delete'}
      />
    </>
  );
}
