import { type NextRequest, NextResponse } from 'next/server';

import { shouldRedirectMobile } from '@/lib/device-access';
import {
  shouldRewriteOauthReturnToCallback,
  updateSession,
} from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') ?? '';

  if (shouldRewriteOauthReturnToCallback(pathname, searchParams.get('code'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  const gate = shouldRedirectMobile(userAgent, pathname);
  if (gate.redirect) {
    const url = request.nextUrl.clone();
    url.pathname = gate.to;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
