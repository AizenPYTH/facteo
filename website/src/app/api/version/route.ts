import { NextResponse } from 'next/server';

/** Version déployée, comparée par les onglets ouverts pour proposer de recharger. */
export function GET() {
  const id = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || null;
  return NextResponse.json({ id }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
