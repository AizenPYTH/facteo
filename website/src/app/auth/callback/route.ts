import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@inveq/types/database';

import { resolvePostAuthDestination } from '@/lib/domain/auth/sync-profile';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

function getPublicOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (host) {
    return `${proto}://${host}`;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (site) {
    return site;
  }

  return request.nextUrl.origin;
}

function applyAuthCookies(
  response: NextResponse,
  cookies: { name: string; value: string; options?: CookieOptions }[],
) {
  const secure = process.env.NODE_ENV === 'production';

  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, {
      ...options,
      path: '/',
      sameSite: 'lax',
      secure: options?.secure ?? secure,
    });
  });
}

/**
 * Échange le code PKCE (OAuth Google, confirmation e-mail, reset) contre une session,
 * synchronise le profil, puis redirige vers /onboarding ou /app.
 */
export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request);
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const next = rawNext && rawNext.startsWith('/') ? rawNext : null;
  const errorDescription = searchParams.get('error_description');
  const oauthError = searchParams.get('error');

  if (errorDescription || oauthError) {
    const message = errorDescription || oauthError || 'auth';
    return NextResponse.redirect(
      `${origin}/login?error=auth&message=${encodeURIComponent(message)}`,
      303,
    );
  }

  if (!code) {
    const fallbackNext = encodeURIComponent(next ?? '/onboarding');
    return NextResponse.redirect(`${origin}/auth/confirm?next=${fallbackNext}`, 303);
  }

  const forwardCookies: { name: string; value: string; options?: CookieOptions }[] = [];

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        forwardCookies.push(...cookiesToSet);
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&message=${encodeURIComponent(error?.message || 'session')}`,
      303,
    );
  }

  const user = data.user ?? data.session.user;
  let destination = '/onboarding';

  if (user) {
    destination = await resolvePostAuthDestination(supabase, user, next);
  }

  const response = NextResponse.redirect(`${origin}${destination}`, 303);
  applyAuthCookies(response, forwardCookies);
  return response;
}
