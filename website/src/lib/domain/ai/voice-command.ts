import { supabase } from '@/lib/supabase';
import { readErrorMessage } from '@/lib/domain/ai/product-image-analysis';

export type VoiceCommandItem = {
  description: string;
  quantity: number;
  unit: string;
  price_ht: number;
};

export type VoiceCommand = {
  document_type: 'quote' | 'invoice';
  client: string;
  items: VoiceCommandItem[];
  vat: number | null;
  payment_terms: number | null;
  discount: number | null;
  currency: string;
  payment_method: string;
  confidence: number;
};

export type VoiceCommandResult = {
  transcript: string;
  command: VoiceCommand;
};

/**
 * Envoie l'enregistrement à la fonction `process-voice-command` : transcription
 * puis extraction du client, des lignes, de la TVA, du délai et de la remise.
 */
export async function processVoiceCommand(input: {
  documentType: 'quote' | 'invoice';
  audioBase64: string;
  mimeType: string;
}): Promise<VoiceCommandResult> {
  const { data, error } = await supabase.functions.invoke<VoiceCommandResult>('process-voice-command', {
    body: input,
  });

  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 404) {
      throw new Error('Fonction Edge introuvable. Déployez process-voice-command sur le projet Supabase.');
    }
    throw new Error(await readErrorMessage(error));
  }

  if (!data?.command) {
    throw new Error('Aucune commande vocale reconnue.');
  }

  return data;
}
