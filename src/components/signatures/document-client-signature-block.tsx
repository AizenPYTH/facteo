import { router, type Href } from 'expo-router';
import { useState } from 'react';

import {
  ClientSignatureModal,
  DocumentSignatureSection,
} from '@/components/signatures/document-signature-section';
import { useDocumentSignature } from '@/hooks/use-document-signature';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';

type DocumentClientSignatureBlockProps = {
  documentType: 'quote' | 'invoice';
  documentId: string;
  documentLabel: string;
  showSignAction?: boolean;
  signModalVisible?: boolean;
  onSignModalVisibleChange?: (visible: boolean) => void;
};

export function DocumentClientSignatureBlock({
  documentType,
  documentId,
  documentLabel,
  showSignAction = true,
  signModalVisible,
  onSignModalVisibleChange,
}: DocumentClientSignatureBlockProps) {
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const { signature, saveSignature, clearSignature } = useDocumentSignature(documentType, documentId);
  const [internalModalVisible, setInternalModalVisible] = useState(false);
  const isLocked = !hasFeature('client_signature');
  const loading = saveSignature.isPending || clearSignature.isPending;
  const modalVisible = signModalVisible ?? internalModalVisible;
  const hasSignature = Boolean(signature?.signatureUrl);

  function setModalVisible(visible: boolean) {
    if (onSignModalVisibleChange) {
      onSignModalVisibleChange(visible);
      return;
    }

    setInternalModalVisible(visible);
  }

  function handleRequestSign() {
    if (isLocked) {
      router.push('/settings/premium' as Href);
      return;
    }

    setModalVisible(true);
  }

  async function handleConfirm(dataUri: string) {
    try {
      await saveSignature.mutateAsync({ dataUri });
      setModalVisible(false);
      showSuccess('Signature enregistrée.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleClearSignature() {
    try {
      await clearSignature.mutateAsync();
      showSuccess('Signature supprimée.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  // Toujours monter la modal si elle est contrôlée par le parent (Actions → Faire signer),
  // sinon un early-return empêche d’ouvrir la signature même quand Max est actif.
  const showSection = showSignAction || hasSignature;
  const externallyControlled = signModalVisible !== undefined;

  if (!showSection && isLocked && !externallyControlled) {
    return null;
  }

  return (
    <>
      {showSection ? (
        <DocumentSignatureSection
          loading={loading}
          locked={isLocked}
          onClearSignature={() => {
            void handleClearSignature();
          }}
          onRequestSign={handleRequestSign}
          showSignAction={showSignAction}
          signatureUrl={signature?.signatureUrl ?? null}
          signedAt={signature?.signedAt ?? null}
        />
      ) : null}

      <ClientSignatureModal
        documentLabel={documentLabel}
        loading={saveSignature.isPending}
        onCancel={() => setModalVisible(false)}
        onConfirm={(dataUri) => {
          void handleConfirm(dataUri);
        }}
        visible={modalVisible}
      />
    </>
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur est survenue.';
}
