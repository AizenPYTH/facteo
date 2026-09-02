import { NextResponse, type NextRequest } from 'next/server';

/**
 * SUPER PDP OAuth callback on the INVEQ domain.
 *
 * Some OAuth providers only accept redirect URIs on the application's own domain.
 * This route forwards `code` / `state` (or the error params) to the Supabase Edge
 * Function that performs the token exchange server-side.
 *
 * No secret is read or exposed here: the Edge Function owns client_id / client_secret.
 * Use this URL as SUPER_PDP_REDIRECT_URI only if it is the value registered at SUPER PDP.
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'Supabase non configuré pour la facturation électronique.' },
      { status: 500 },
    );
  }

  const target = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/superpdp-oauth-callback`);

  for (const [key, value] of request.nextUrl.searchParams) {
    target.searchParams.set(key, value);
  }

  return NextResponse.redirect(target.toString(), 302);
}
