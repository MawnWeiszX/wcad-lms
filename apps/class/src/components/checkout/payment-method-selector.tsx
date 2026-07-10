'use client';

import { CreditCard, Landmark, AlertCircle } from 'lucide-react';

export type PaymentMethodType = 'mercadopago' | 'paypal' | 'yape' | 'plin';

interface Props {
  selected: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  isMpAvailable: boolean;
  isPayPalAvailable: boolean;
}

export function PaymentMethodSelector({ selected, onChange, isMpAvailable, isPayPalAvailable }: Props) {
  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-[var(--color-text)]">
        Selecciona un método de pago
      </label>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Mercado Pago (Tarjeta) */}
        <button
          type="button"
          onClick={() => isMpAvailable && onChange('mercadopago')}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
            !isMpAvailable
              ? 'opacity-60 cursor-not-allowed border-[var(--color-border)] bg-[var(--color-disabled-bg)]'
              : selected === 'mercadopago'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/25'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            !isMpAvailable
              ? 'bg-[var(--color-disabled-bg)] text-[var(--color-disabled-text)]'
              : selected === 'mercadopago'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
          }`}>
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--color-text)]">Pago con Tarjeta</span>
              {!isMpAvailable && (
                <span className="rounded bg-[var(--color-disabled-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-disabled-text)]">
                  Próximamente
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Mercado Pago (Soles)</p>
          </div>
        </button>

        {/* PayPal */}
        <button
          type="button"
          onClick={() => isPayPalAvailable && onChange('paypal')}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
            !isPayPalAvailable
              ? 'opacity-60 cursor-not-allowed border-[var(--color-border)] bg-[var(--color-disabled-bg)]'
              : selected === 'paypal'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/25'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            !isPayPalAvailable
              ? 'bg-[var(--color-disabled-bg)] text-[var(--color-disabled-text)]'
              : selected === 'paypal'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
          }`}>
            <Landmark className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--color-text)]">PayPal</span>
              {!isPayPalAvailable && (
                <span className="rounded bg-[var(--color-disabled-bg)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-disabled-text)]">
                  Próximamente
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">USD (Conversión soles)</p>
          </div>
        </button>

        {/* Yape (Manual) */}
        <button
          type="button"
          onClick={() => onChange('yape')}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
            selected === 'yape'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/25'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            selected === 'yape' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
          }`}>
            <span className="font-bold text-sm">Y</span>
          </div>
          <div className="flex-1">
            <span className="font-semibold text-sm text-[var(--color-text)]">Yape</span>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Depósito manual</p>
          </div>
        </button>

        {/* Plin (Manual) */}
        <button
          type="button"
          onClick={() => onChange('plin')}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
            selected === 'plin'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/25'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
          }`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            selected === 'plin' ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-600'
          }`}>
            <span className="font-bold text-sm">P</span>
          </div>
          <div className="flex-1">
            <span className="font-semibold text-sm text-[var(--color-text)]">Plin</span>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Depósito manual</p>
          </div>
        </button>
      </div>

      {!isMpAvailable && !isPayPalAvailable && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--color-amber-bg)] p-3.5 text-xs text-[var(--color-amber-text)] border border-[var(--color-amber-border)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Los métodos de pago automáticos están en mantenimiento. Puedes completar tu compra usando Yape o Plin.</span>
        </div>
      )}
    </div>
  );
}
