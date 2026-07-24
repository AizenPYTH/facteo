import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';

import type { Database } from '@inveq/types/database';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

/**
 * Échange le code PKCE (OAuth Google, confirmation e-mail, reset) contre une session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/onboarding';
  const next = rawNext.startsWith('/') ? rawNext : '/onboarding';
  const errorDescription = searchParams.get('error_description');

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=auth&message=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/confirm?next=${encodeURIComponent(next)}`);
  }

  const forwardCookies: { name: string; value: string; options?: CookieOptions }[] = [];

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return (
          request.headers
            .get('cookie')
            ?.split(';')
            .map((part) => {
              const [name, ...rest] = part.trim().split('=');
              return { name, value: rest.join('=') };
            })
            .filter((cookie) => Boolean(cookie.name)) ?? []
        );
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        forwardCookies.push(...cookiesToSet);
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const user = data.user ?? data.session?.user;
  let destination = next;

  if (user) {
    const meta = user.user_metadata ?? {};
    const firstName =
      (typeof meta.first_name === 'string' && meta.first_name) ||
      (typeof meta.given_name === 'string' && meta.given_name) ||
      null;
    const lastName =
      (typeof meta.last_name === 'string' && meta.last_name) ||
      (typeof meta.family_name === 'string' && meta.family_name) ||
      null;
    const avatarUrl =
      (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
      (typeof meta.picture === 'string' && meta.picture) ||
      null;

    const { data: existing } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, avatar_url, onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    await supabase
      .from('profiles')
      .update({
        first_name: existing?.first_name || firstName,
        last_name: existing?.last_name || lastName,
        email: existing?.email || user.email || null,
        avatar_url: existing?.avatar_url || avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    const done = Boolean(existing?.onboarding_completed);
    if (destination.startsWith('/app') && !done) {
      destination = '/onboarding';
    } else if (destination.startsWith('/onboarding') && done) {
      destination = '/app';
    } else if (destination.startsWith('/auth/confirmed')) {
      destination = done ? '/app' : '/onboarding';
    }
  }

  const redirectUrl = `${origin}${destination}`;
  const response = NextResponse.redirect(redirectUrl);

  forwardCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
