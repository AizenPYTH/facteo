import { readLocalFileAsBytes } from '@/lib/files/read-as-bytes';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

export const DOCUMENT_SIGNATURES_BUCKET = 'document-signatures';

function buildSignaturePath(
  userId: string,
  documentType: 'quote' | 'invoice',
  documentId: string,
): string {
  const timestamp = Date.now();
  return `${userId}/${documentType}/${documentId}-${timestamp}.png`;
}

export function getDocumentSignaturePublicUrl(path: string): string {
  const { data } = supabase.storage.from(DOCUMENT_SIGNATURES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadDocumentSignatureFromDataUri(
  userId: string,
  documentType: 'quote' | 'invoice',
  documentId: string,
  dataUri: string,
): Promise<string> {
  const base64 = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const path = buildSignaturePath(userId, documentType, documentId);

  const { error } = await supabase.storage.from(DOCUMENT_SIGNATURES_BUCKET).upload(path, bytes, {
    contentType: 'image/png',
    upsert: true,
  });

  if (error) {
    logSupabaseError('uploadDocumentSignatureFromDataUri', error);
    throw error;
  }

  return getDocumentSignaturePublicUrl(path);
}

export async function uploadDocumentSignatureFromFile(
  userId: string,
  documentType: 'quote' | 'invoice',
  documentId: string,
  fileUri: string,
): Promise<string> {
  const path = buildSignaturePath(userId, documentType, documentId);
  const bytes = await readLocalFileAsBytes(fileUri);

  const { error } = await supabase.storage.from(DOCUMENT_SIGNATURES_BUCKET).upload(path, bytes, {
    contentType: 'image/png',
    upsert: true,
  });

  if (error) {
    logSupabaseError('uploadDocumentSignatureFromFile', error);
    throw error;
  }

  return getDocumentSignaturePublicUrl(path);
}

export async function deleteDocumentSignatureByUrl(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${DOCUMENT_SIGNATURES_BUCKET}/`;

  if (!publicUrl.includes(marker)) {
    return;
  }

  const path = publicUrl.split(marker)[1];

  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(DOCUMENT_SIGNATURES_BUCKET).remove([path]);

  if (error) {
    logSupabaseError('deleteDocumentSignatureByUrl', error);
    throw error;
  }
}
