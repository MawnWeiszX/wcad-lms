/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { signInWithGoogle } from '@/app/actions/auth';
import { X, Droplets, Loader2 } from 'lucide-react';
import { useFormStatus, createPortal } from 'react-dom';
import Script from 'next/script';
import { createClient } from '@wcad/utils/supabase/client';

// ── Botón Google con estado de carga ─────────────────────────
function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      id="btn-google-signin"
      className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
      ) : (
        /* Logo de Google SVG real */
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
      )}
      <span>{pending ? 'Conectando con Google...' : 'Continuar con Google'}</span>
    </button>
  );
}

// ── Modal de autenticación ────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function AuthModal({ open, onClose, redirectTo }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const supabase = createClient();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Temporizador para activar el fallback si el script de Google no carga (por ejemplo, bloqueado por CSP o extensiones)
  useEffect(() => {
    if (clientId && !scriptLoaded && open) {
      const timer = setTimeout(() => {
        if (!(window as any).google) {
          console.warn('DEBUG [AuthModal] Google GSI script no cargó en 2.5s. Activando fallback a redirección clásica.');
          setUseFallback(true);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [clientId, scriptLoaded, open]);

  // Temporizador para activar el fallback si el script cargó pero falló al renderizar el botón (por ejemplo, origen no autorizado)
  useEffect(() => {
    if (clientId && scriptLoaded && open && !useFallback) {
      const timer = setTimeout(() => {
        const container = document.getElementById('google-signin-btn-container');
        if (container && container.children.length === 0) {
          console.warn('DEBUG [AuthModal] El botón oficial de Google no se renderizó (posible origen no autorizado o error de inicialización). Activando fallback.');
          setUseFallback(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [clientId, scriptLoaded, open, useFallback]);

  // Callback para recibir el ID Token de Google e iniciar sesión
  const handleCredentialResponse = useCallback(async (response: any) => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      const idToken = response.credential;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        throw error;
      }

      // Obtener el perfil para redirigir según el rol del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = (await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()) as any;

        const isProfesor =
          profile?.role === 'profesor' ||
          profile?.role === 'teacher' ||
          profile?.role === 'admin';

        const initialModo = isProfesor ? 'profesor' : 'alumno';

        // Configurar la cookie de modo activo de inmediato para el middleware
        const hasSharedDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('wcadservice.com');
        const cookieDomain = (process.env.NODE_ENV === 'production' && hasSharedDomain) ? '; domain=.wcadservice.com; path=/' : '; path=/';
        document.cookie = `modoActivo=${initialModo}${cookieDomain}; max-age=31536000; SameSite=Lax`;

        // Redirección basada en el rol
        if (isProfesor) {
          const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3001';
          window.location.href = `${portalUrl}/dashboard`;
        } else {
          window.location.href = redirectTo || '/dashboard';
        }
      }
    } catch (err: any) {
      console.error('Error during GSI Sign-In:', err);
      setErrorMsg(err.message || 'Error al iniciar sesión con Google');
      setIsSigningIn(false);
    }
  }, [supabase, redirectTo]);

  // Verificar si la biblioteca ya fue cargada previamente
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google) {
      setScriptLoaded(true);
    }
  }, []);

  // Inicializar y renderizar el botón oficial de Google
  useEffect(() => {
    if (clientId && scriptLoaded && typeof window !== 'undefined' && (window as any).google) {
      const google = (window as any).google;
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn-container'),
          {
            theme: 'outline',
            size: 'large',
            width: 320,
            shape: 'rectangular',
            text: 'signin_with',
          }
        );
      } catch (err) {
        console.error('Failed to initialize Google GSI:', err);
      }
    }
  }, [clientId, scriptLoaded, open, handleCredentialResponse]);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !mounted) return null;

  const signInAction = signInWithGoogle.bind(null, redirectTo);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop oscuro con desenfoque elegante (Coincide con la Imagen 2) */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Tarjeta del Modal (Siempre blanca pura y sólida como en la Imagen 2) */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-[380px] animate-fade-in-up rounded-[28px] bg-white p-7 sm:p-8 shadow-2xl transition-all"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          id="btn-modal-close"
          className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Encabezado e Icono */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-600/30">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Accede a WCAD
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Usa tu cuenta de Google para ingresar
          </p>
        </div>

        {/* Botón Google (GSI con fallback a redirect clásico) */}
        {clientId && !useFallback ? (
          <div className="relative">
            <Script
              src="https://accounts.google.com/gsi/client"
              onLoad={() => setScriptLoaded(true)}
              onError={() => {
                console.error('DEBUG [AuthModal] Error al cargar script GSI. Activando fallback.');
                setUseFallback(true);
              }}
              strategy="afterInteractive"
            />
            {isSigningIn ? (
              <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-medium text-slate-700 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary)]" />
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              <div id="google-signin-btn-container" className="w-full min-h-[46px] flex justify-center" />
            )}
            {errorMsg && (
              <p className="mt-2 text-center text-xs text-red-600 font-medium">{errorMsg}</p>
            )}
          </div>
        ) : (
          <form action={signInAction}>
            <GoogleButton />
          </form>
        )}

        {/* Línea divisoria */}
        <div className="my-6 border-t border-slate-100" />

        {/* Beneficios */}
        <ul className="space-y-3">
          {[
            'Acceso inmediato a todos tus cursos',
            'Progreso guardado automáticamente',
            'Certificados al completar',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-xs font-medium text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* Términos y Privacidad */}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400">
          Al continuar, aceptas nuestros{' '}
          <a href="#" className="font-medium text-slate-500 underline hover:text-slate-800 transition-colors">
            Términos de uso
          </a>{' '}
          y{' '}
          <a href="#" className="font-medium text-slate-500 underline hover:text-slate-800 transition-colors">
            Política de privacidad
          </a>
          .
        </p>
      </div>
    </div>,
    document.body
  );
}
