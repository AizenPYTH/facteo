import * as ImagePicker from 'expo-image-picker';
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Alert, FlatList, Linking, Platform, Text, View } from 'react-native';

import {
  ProductAnalysisConfirmationModal,
  type ProductAnalysisDraft,
} from '@/components/ai/product-analysis-confirmation-modal';
import { ProductAnalysisLoadingModal } from '@/components/ai/product-analysis-loading-modal';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useWizardFooterInset } from '@/components/ui/wizard-screen';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePlatformActionSheet } from '@/hooks/use-platform-action-sheet';
import { useSubscription } from '@/hooks/use-subscription';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { analyzeProductImage } from '@/lib/ai/product-image-analysis';
import { createProduct } from '@/lib/supabase/products';
import { useToast } from '@/providers/toast-provider';
import type { ProductImageAnalysis } from '@/types/ai-product';
import type { QuoteLineValue } from '@/types/quote';
import { createEmptyQuoteLine, formatDecimalForInput } from '@/types/quote';
import { router, type Href } from 'expo-router';

import { QuoteLine } from './quote-line';

type QuoteAddLinesStepProps = {
  lines: QuoteLineValue[];
  onAddLine: (line: QuoteLineValue) => void;
  onChangeLine: (index: number, line: QuoteLineValue) => void;
  onRemoveLine: (index: number) => void;
};

export function QuoteAddLinesStep({
  lines,
  onAddLine,
  onChangeLine,
  onRemoveLine,
}: QuoteAddLinesStepProps) {
  const styles = useStyles();
  const { openActionSheet, actionSheetNode } = usePlatformActionSheet();
  const { user } = useAuth();
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const footerInset = useWizardFooterInset();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0.08);
  const [analysisImageUri, setAnalysisImageUri] = useState<string | null>(null);
  const [analysisDraft, setAnalysisDraft] = useState<ProductAnalysisDraft | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      clearProgressTimer(progressTimerRef);
    };
  }, []);

  function handleAddManualPrestation() {
    onAddLine(createEmptyQuoteLine());
  }

  function handleScanProductWithAi() {
    void handleSourceSelection(Platform.OS === 'web' ? 'gallery' : 'camera');
  }

  function handleAddPrestation() {
    openActionSheet({
      title: 'Ajouter une prestation',
      options: [
        {
          label: 'Ajouter manuellement',
          onPress: handleAddManualPrestation,
        },
        {
          label: "Scanner un produit avec l'IA",
          onPress: handleScanProductWithAi,
        },
      ],
    });
  }

  async function handleSourceSelection(source: 'camera' | 'gallery') {
    try {
      if (!hasFeature('ai_assistant')) {
        router.push('/settings/premium' as Href);
        return;
      }

      const selected = await pickImageSource(source);

      if (!selected) {
        return;
      }

      setAnalysisImageUri(selected.uri);
      setIsAnalyzing(true);
      setAnalysisProgress(0.1);
      startProgressTimer(progressTimerRef, setAnalysisProgress);

      const analyzed = await analyzeProductImage({
        imageBase64: selected.base64,
        mimeType: selected.mimeType,
      });

      setAnalysisProgress(1);
      setAnalysisDraft(mapAnalysisToDraft(analyzed));
    } catch (error) {
      const message = readAiErrorMessage(error);

      if (message.includes('Permission caméra bloquée')) {
        Alert.alert('Caméra requise', message, [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir les réglages',
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]);
      } else {
        showError(message);
      }
    } finally {
      clearProgressTimer(progressTimerRef);
      setIsAnalyzing(false);
    }
  }

  function handleCloseConfirmationModal() {
    setAnalysisDraft(null);
    setAnalysisImageUri(null);
  }

  async function handleConfirmAiProduct() {
    if (!analysisDraft || !user?.id) {
      showError('Session invalide. Reconnectez-vous puis réessayez.');
      return;
    }

    const title = analysisDraft.title.trim();
    const description = analysisDraft.description.trim();
    const reference = analysisDraft.reference.trim();
    const unit = (analysisDraft.unit.trim() || 'pièce').toLowerCase();
    const quantity = parseNumericInput(analysisDraft.quantity) ?? 1;
    const vatRate = parseNumericInput(analysisDraft.vatRate) ?? 20;
    const priceHt = resolvePriceHt(analysisDraft);

    if (!title && !description) {
      showError('Ajoutez au moins un nom ou une description avant de créer le produit.');
      return;
    }

    try {
      setIsSavingProduct(true);
      const product = await createProduct({
        userId: user.id,
        name: title || description || 'Produit importé IA',
        description,
        unitPrice: priceHt ?? 0,
        vatRate,
        unit,
        reference,
        type: 'product',
      });

      onAddLine({
        id: createEmptyQuoteLine().id,
        productId: product.id,
        description: title || description || product.name,
        quantity: formatDecimalForInput(quantity),
        unit,
        unitPrice: priceHt === null ? '' : formatDecimalForInput(priceHt),
        vatRate: formatDecimalForInput(vatRate),
        discountPercent: '0',
      });

      showSuccess('Produit créé et ajouté à votre document.');
      handleCloseConfirmationModal();
    } catch (error) {
      showError(readAiErrorMessage(error));
    } finally {
      setIsSavingProduct(false);
    }
  }

  const listHeader = (
    <View style={styles.headerSection}>
      <Text style={styles.sectionLabel}>
        {lines.length > 1 ? `${lines.length} prestations` : `${lines.length} prestation`}
      </Text>
    </View>
  );

  // Le bouton d'ajout est en pied de liste, là où se trouve le pouce après
  // avoir rempli la dernière ligne — il était en tête, donc hors d'atteinte dès
  // la deuxième prestation.
  const listFooter = (
    <View style={styles.footerSection}>
      <Button onPress={handleAddPrestation} title="Ajouter une prestation" variant="ghost" />
      {Platform.OS === 'web' ? (
        <Button
          onPress={handleScanProductWithAi}
          title="Scanner un produit (IA)"
          variant="ghost"
        />
      ) : null}
    </View>
  );

  if (lines.length === 0) {
    return (
      <>
        <View style={styles.container}>
          <EmptyState
            actionLabel="Ajouter une prestation"
            description="Description, quantité, prix HT, TVA et remise éventuelle."
            icon={{ ios: 'list.bullet.rectangle', android: 'list_alt', web: 'list_alt' }}
            onAction={handleAddPrestation}
            title="Aucune prestation"
          />
          {Platform.OS === 'web' ? (
            <Button
              onPress={handleScanProductWithAi}
              title="Scanner un produit (IA)"
              variant="ghost"
            />
          ) : null}
        </View>
        {actionSheetNode}
        <ProductAnalysisLoadingModal progress={analysisProgress} visible={isAnalyzing} />
        {analysisDraft && analysisImageUri ? (
          <ProductAnalysisConfirmationModal
            imageUri={analysisImageUri}
            isSaving={isSavingProduct}
            onChange={setAnalysisDraft}
            onClose={handleCloseConfirmationModal}
            onConfirm={() => {
              void handleConfirmAiProduct();
            }}
            value={analysisDraft}
            visible
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={lines}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        renderItem={({ item, index }) => (
          <QuoteLine
            index={index}
            onChange={(updatedLine) => onChangeLine(index, updatedLine)}
            onRemove={() => onRemoveLine(index)}
            value={item}
          />
        )}
        renderScrollComponent={(props) => (
          <KeyboardAwareScrollView {...props} bottomOffset={footerInset} keyboardShouldPersistTaps="handled" />
        )}
        showsVerticalScrollIndicator={false}
      />
      {actionSheetNode}
      <ProductAnalysisLoadingModal progress={analysisProgress} visible={isAnalyzing} />
      {analysisDraft && analysisImageUri ? (
        <ProductAnalysisConfirmationModal
          imageUri={analysisImageUri}
          isSaving={isSavingProduct}
          onChange={setAnalysisDraft}
          onClose={handleCloseConfirmationModal}
          onConfirm={() => {
            void handleConfirmAiProduct();
          }}
          value={analysisDraft}
          visible
        />
      ) : null}
    </>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerSection: {
    paddingBottom: spacing.xs,
  },
  footerSection: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
}));
}

function clearProgressTimer(timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>) {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function startProgressTimer(
  timerRef: MutableRefObject<ReturnType<typeof setInterval> | null>,
  setProgress: Dispatch<SetStateAction<number>>,
) {
  clearProgressTimer(timerRef);
  timerRef.current = setInterval(() => {
    setProgress((current) => (current >= 0.92 ? current : current + 0.06));
  }, 280);
}

async function pickImageSource(source: 'camera' | 'gallery'): Promise<{
  uri: string;
  base64: string;
  mimeType: string;
} | null> {
  if (source === 'camera' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        throw new Error(
          "Permission caméra bloquée. Activez-la dans Réglages pour scanner un produit avec l'IA.",
        );
      }
      throw new Error('Permission refusée pour utiliser l’appareil photo.');
    }
  }

  if (source === 'gallery' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permission refusée pour accéder à la photothèque.');
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];

  if (!asset.base64) {
    throw new Error('Capture invalide. Réessayez avec une autre image.');
  }

  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

function mapAnalysisToDraft(analysis: ProductImageAnalysis): ProductAnalysisDraft {
  const vatRate = analysis.vat ?? 20;
  const priceTtc = analysis.price_ttc;
  const priceHt = analysis.price_ht ?? (priceTtc !== null ? computePriceHtFromTtc(priceTtc, vatRate) : null);

  return {
    title: analysis.title ?? '',
    brand: analysis.brand ?? '',
    model: analysis.model ?? '',
    reference: analysis.reference ?? '',
    description: analysis.description ?? '',
    unitPriceHt: priceHt === null ? '' : formatDecimalForInput(priceHt),
    unitPriceTtc: priceTtc === null ? '' : formatDecimalForInput(priceTtc),
    vatRate: formatDecimalForInput(vatRate),
    currency: analysis.currency || 'EUR',
    unit: analysis.unit || 'pièce',
    quantity: formatDecimalForInput(Math.max(1, analysis.quantity || 1)),
    confidence: Math.max(0, Math.min(1, analysis.confidence || 0)),
  };
}

function parseNumericInput(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function computePriceHtFromTtc(priceTtc: number, vatRate: number): number {
  const divider = 1 + Math.max(vatRate, 0) / 100;
  return divider > 0 ? priceTtc / divider : priceTtc;
}

function resolvePriceHt(draft: ProductAnalysisDraft): number | null {
  const directHt = parseNumericInput(draft.unitPriceHt);

  if (directHt !== null) {
    return directHt;
  }

  const ttc = parseNumericInput(draft.unitPriceTtc);
  const vatRate = parseNumericInput(draft.vatRate) ?? 20;

  if (ttc === null) {
    return null;
  }

  return computePriceHtFromTtc(ttc, vatRate);
}

function readAiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('Permission refusée')) {
      return 'Autorisez la caméra ou les fichiers pour scanner un produit avec l’IA.';
    }

    if (message.includes('Permission caméra bloquée')) {
      return message;
    }

    if (message.includes('Network') || message.includes('Failed to fetch')) {
      return 'Connexion réseau indisponible. Vérifiez votre accès Internet.';
    }

    if (message.includes('Unauthorized') || message.includes('Session')) {
      return 'Session expirée. Reconnectez-vous puis réessayez.';
    }

    if (message.includes("n'est pas encore configuré") || message.includes('n’est pas encore configuré')) {
      return "L'assistant IA n'est pas encore configuré.";
    }

    return message || 'Analyse impossible pour cette image.';
  }

  return 'Analyse impossible pour cette image.';
}
