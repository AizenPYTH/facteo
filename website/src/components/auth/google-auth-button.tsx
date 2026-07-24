'use client';

import { useState } from 'react';

import { getAuthErrorMessage } from '@/lib/domain/auth/errors';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

type GoogleAuthButtonProps = {
  label?: string;
  className?: string;
};

export function GoogleAuthButton({
  label = 'Continuer avec Google',
  className,
}: GoogleAuthButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const { error: oauthError } = await signInWithGoogle();
      if (oauthError) {
        setError(getAuthErrorMessage(oauthError.message));
        setLoading(false);
      }
      // On success Supabase redirects away — keep loading state
    } catch {
      setError('Impossible de démarrer la connexion Google.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className={cn(
          'flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60',
          className,
        )}
        disabled={loading}
        onClick={() => void handleClick()}
        type="button">
        <GoogleGlyph />
        {loading ? 'Redirection…' : label}
      </button>
      {error ? (
        <p className="text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthDivider({ label = 'ou' }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div aria-hidden className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-white px-3 text-slate-400">{label}</span>
      </div>
    </div>
  );
}
