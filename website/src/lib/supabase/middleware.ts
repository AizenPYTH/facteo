import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@inveq/types/database';

import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env';

async function fetchOnboardingCompleted(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  return Boolean(data?.onboarding_completed);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAppRoute = pathname.startsWith('/app');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/mot-de-passe-oublie') ||
    pathname.startsWith('/reinitialiser-mot-de-passe') ||
    pathname.startsWith('/auth');

  if ((isAppRoute || isOnboardingRoute) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (isAppRoute || isOnboardingRoute || (isAuthRoute && !pathname.startsWith('/auth')))) {
    const onboardingDone = await fetchOnboardingCompleted(supabase, user.id);

    if (isAppRoute && !onboardingDone) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding';
      onboardingUrl.search = '';
      return NextResponse.redirect(onboardingUrl);
    }

    if (isOnboardingRoute && onboardingDone) {
      const appUrl = request.nextUrl.clone();
      appUrl.pathname = '/app';
      appUrl.search = '';
      return NextResponse.redirect(appUrl);
    }
  }

  if (isAuthRoute && user) {
    if (
      pathname.startsWith('/reinitialiser-mot-de-passe') ||
      pathname.startsWith('/auth/confirm') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/auth/confirmed')
    ) {
      return response;
    }

    const onboardingDone = await fetchOnboardingCompleted(supabase, user.id);
    const dest = request.nextUrl.clone();
    dest.pathname = onboardingDone ? '/app' : '/onboarding';
    dest.search = '';
    return NextResponse.redirect(dest);
  }

  return response;
}
