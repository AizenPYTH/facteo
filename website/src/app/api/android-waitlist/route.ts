import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const userAgent = request.headers.get('user-agent')?.slice(0, 400) ?? null;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('android_waitlist').insert({
      email,
      user_agent: userAgent,
      source: 'mobile_android_page',
    });

    if (error) {
      // Déjà inscrit → succès silencieux
      if (error.code === '23505') {
        return NextResponse.json({ ok: true });
      }
      console.error('[android-waitlist]', error.message);
      return NextResponse.json(
        { error: 'Inscription temporairement indisponible. Réessayez plus tard.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[android-waitlist]', error);
    return NextResponse.json(
      { error: 'Inscription temporairement indisponible. Réessayez plus tard.' },
      { status: 503 },
    );
  }
}
