'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  courseIds: string[];
  amount: number;
  method: 'yape' | 'plin';
  isLoggedIn?: boolean;
  onRequiredLogin?: () => void;
}

export function YapePlinForm({ courseIds, amount, method, isLoggedIn = true, onRequiredLogin }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phone = '987 654 321';
  const owner = 'WCAD SAC';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSizeBytes) {
        setErrorMsg('El archivo seleccionado supera el límite de 5MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setErrorMsg(null);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      onRequiredLogin?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequiredLogin?.();
      return;
    }
    if (!file) {
      setErrorMsg('Por favor selecciona la captura de pantalla de tu pago.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseIds', JSON.stringify(courseIds));
      formData.append('method', method);

      const res = await fetch('/api/payments/manual/upload-voucher', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Error al enviar comprobante.');
      }

      setSuccess(true);
    } catch (err) {
      const errorObj = err as { message?: string };
      console.error(err);
      setErrorMsg(errorObj.message || 'Ocurrió un error al enviar el comprobante.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-500/10 p-6 text-center border border-emerald-500/25">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">¡Comprobante enviado con éxito!</h3>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
          Tu pago se encuentra en proceso de validación. Nos tomará un máximo de 24 horas verificarlo y activar tu acceso al curso. Te notificaremos vía correo electrónico.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-6 inline-flex justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Ir al Panel de Alumno
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="text-center">
        <h3 className="text-base font-bold text-[var(--color-text)] capitalize">
          Pagar con {method}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Realiza la transferencia en soles desde tu app móvil
        </p>
      </div>

      {/* Datos del Pago */}
      <div className="rounded-xl bg-[var(--color-surface-alt)] p-4 space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Monto a depositar:</span>
          <span className="font-bold text-[var(--color-text)]">S/ {amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Número celular:</span>
          <span className="font-bold text-[var(--color-text)]">{phone}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Titular:</span>
          <span className="font-bold text-[var(--color-text)]">{owner}</span>
        </div>
      </div>

      {/* Carga del voucher */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[var(--color-text)]">
          Sube tu captura de pantalla / voucher de pago
        </label>
        
        <div className="flex justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] px-6 py-8 hover:bg-[var(--color-surface-hover)] transition-all">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
            <div className="flex text-sm text-[var(--color-text-secondary)] justify-center">
              <label 
                onClick={handleUploadClick}
                className="relative cursor-pointer rounded-md font-semibold text-[var(--color-primary)] focus-within:outline-none hover:underline"
              >
                <span>Seleccionar comprobante</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG, JPEG hasta 5MB</p>
            {file && (
              <p className="text-xs font-semibold text-emerald-600 mt-2 truncate max-w-xs mx-auto">
                Seleccionado: {file.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="text-center text-xs font-semibold text-red-500">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar comprobante
      </button>
    </form>
  );
}
