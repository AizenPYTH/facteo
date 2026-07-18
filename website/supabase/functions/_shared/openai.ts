export async function requestOpenAiJsonSchema(input: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt?: string;
  userContent?: Array<Record<string, unknown>>;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<string> {
  const userContent =
    input.userContent && input.userContent.length > 0
      ? input.userContent
      : [{ type: 'input_text', text: input.userPrompt ?? '' }];

  const response = await fetchWithTimeout('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: input.systemPrompt }],
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: input.schemaName,
          schema: input.schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? 'Analyse IA indisponible.');
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const outputText = payload.output_text;

  if (typeof outputText === 'string' && outputText.trim()) {
    return outputText;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? (item as { content: unknown[] }).content
      : [];

    for (const part of content) {
      if (!part || typeof part !== 'object') {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string' && text.trim()) {
        return text;
      }
    }
  }

  throw new Error('Reponse IA invalide.');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 45_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OPENAI_TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
