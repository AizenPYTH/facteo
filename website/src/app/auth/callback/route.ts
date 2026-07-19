import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';

import type { Database } from '@facteo/types/database';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

/**
 * Échange le code PKCE (confirmation e-mail / reset password) contre une session,
 * en attachant correctement les cookies au redirect (évite la page vide).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/auth/confirmed';
  const next = rawNext.startsWith('/') ? rawNext : '/auth/confirmed';
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&message=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    // Anciens liens avec tokens dans le hash → page client dédiée
    return NextResponse.redirect(`${origin}/auth/confirm?next=${encodeURIComponent(next)}`);
  }

  const forwardCookies: { name: string; value: string; options?: CookieOptions }[] = [];

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.headers
          .get('cookie')
          ?.split(';')
          .map((part) => {
            const [name, ...rest] = part.trim().split('=');
            return { name, value: rest.join('=') };
          })
          .filter((cookie) => Boolean(cookie.name)) ?? [];
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        forwardCookies.push(...cookiesToSet);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const redirectUrl = `${origin}${next}`;
  const response = NextResponse.redirect(redirectUrl);

  forwardCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
