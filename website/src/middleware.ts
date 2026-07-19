import { type NextRequest, NextResponse } from 'next/server';

import { shouldRedirectMobile } from '@/lib/device-access';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') ?? '';

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
