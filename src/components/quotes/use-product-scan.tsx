import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';

import {
  ProductAnalysisConfirmationModal,
  type ProductAnalysisDraft,
} from '@/components/ai/product-analysis-confirmation-modal';
import { ProductAnalysisLoadingModal } from '@/components/ai/product-analysis-loading-modal';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { analyzeProductImage } from '@/lib/ai/product-image-analysis';
import { presentNatively } from '@/lib/native/presentation';
import { createProduct } from '@/lib/supabase/products';
import { useToast } from '@/providers/toast-provider';
import type { ProductImageAnalysis } from '@/types/ai-product';
import type { QuoteLineValue } from '@/types/quote';
import { createEmptyQuoteLine, formatDecimalForInput } from '@/types/quote';

/**
 * Lecture d'une fiche produit par l'IA (photo → produit du catalogue → ligne).
 *
 * Sortie de `QuoteAddLinesStep` pour être partagée avec l'assistant de facture
 * iPhone : même parcours, mêmes modales, même création de produit.
 * `scanNodes` porte les modales (chargement, confirmation) à rendre par l'écran.
 */
export function useProductScan(onAddLine: (line: QuoteLineValue) => void): {
  startScan: () => void;
  scanNodes: ReactNode;
} {
  const { user } = useAuth();
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
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

  function startScan() {
    void handleSourceSelection(Platform.OS === 'web' ? 'gallery' : 'camera');
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
        // Titre et description sont deux champs distincts : l'analyse IA les
        // fournit séparément, on ne les écrase plus l'un par l'autre.
        title: title || product.name,
        description,
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

  const scanNodes = (
    <>
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

  return { startScan, scanNodes };
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
          'Permission caméra bloquée. Activez-la dans Réglages pour photographier une fiche produit.',
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

  // Appareil photo et photothèque sont des vues natives : scanner une fiche,
  // revenir, puis en scanner une autre enchaînait deux présentations.
  const result = await presentNatively(() =>
    source === 'camera'
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
          base64: true,
        }),
  );

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
      return 'Autorisez la caméra ou les fichiers pour importer une fiche produit.';
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
