'use client';

import { LogIn } from 'lucide-react';
import { signInWithGoogle } from '@/app/actions/auth';

export function HeroLoginButton() {
  return (
    <form action={() => signInWithGoogle('/dashboard')}>
      <button
        type="submit"
        id="cta-login-hero"
        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-3.5 text-base font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] active:scale-[0.98] cursor-pointer"
      >
        <LogIn className="h-4 w-4" />
        Ingresar
      </button>
    </form>
  );
}
