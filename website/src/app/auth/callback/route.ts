import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { Database } from '@facteo/types/database';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const safeNext = next.startsWith('/') ? next : '/app';
  return NextResponse.redirect(`${origin}${safeNext}`);
}
