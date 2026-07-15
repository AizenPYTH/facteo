/** Version web — lecture de fichiers locaux via fetch (blob URLs). */
export async function readLocalFileAsBytes(fileUri: string): Promise<Uint8Array> {
  const response = await fetch(fileUri);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
