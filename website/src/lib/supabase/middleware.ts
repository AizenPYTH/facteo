import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from '@inveq/types/database';

import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env';

async function fetchOnboardingCompleted(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  // Si le profil n'existe pas encore, forcer l'onboarding
  if (error || !data) return false;
  return Boolean(data.onboarding_completed);
}

function redirectTo(request: NextRequest, pathname: string, clearSearch = true) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (clearSearch) url.search = '';
  return NextResponse.redirect(url);
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
  const isPublicAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/mot-de-passe-oublie') ||
    pathname.startsWith('/connexion') ||
    pathname.startsWith('/inscription');
  const isAuthFlowRoute =
    pathname.startsWith('/reinitialiser-mot-de-passe') ||
    pathname.startsWith('/auth/confirm') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth/confirmed');

  // Routes privées sans session
  if ((isAppRoute || isOnboardingRoute) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response;
  }

  // Flux auth technique : ne pas bloquer
  if (isAuthFlowRoute) {
    return response;
  }

  const onboardingDone = await fetchOnboardingCompleted(supabase, user.id);

  if (isAppRoute && !onboardingDone) {
    return redirectTo(request, '/onboarding');
  }

  if (isOnboardingRoute && onboardingDone) {
    return redirectTo(request, '/app');
  }

  // Déjà connecté → login/register inutiles
  if (isPublicAuthRoute) {
    return redirectTo(request, onboardingDone ? '/app' : '/onboarding');
  }

  return response;
}
