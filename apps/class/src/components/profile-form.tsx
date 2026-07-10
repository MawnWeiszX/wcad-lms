'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@wcad/utils/supabase/client';
import {
  Loader2, Save, CheckCircle2,
  AlertTriangle, User, FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  initialData: {
    full_name: string;
    bio: string;
    country_code: string;
    role: string;
    avatar_url: string | null;
    email: string;
  };
}

const COUNTRIES = [
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'CU', name: 'Cuba' },
  { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' },
];

// Paleta de gradientes para el avatar — se elige por la inicial
const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-purple-600',
  'from-teal-500 to-green-600',
  'from-sky-500 to-blue-600',
];

function getAvatarGradient(name: string) {
  const char = (name || 'U').toUpperCase().charCodeAt(0);
  return AVATAR_GRADIENTS[char % AVATAR_GRADIENTS.length];
}

function AvatarDisplay({
  avatarUrl,
  name,
  email,
  size = 'lg',
}: {
  avatarUrl: string | null;
  name: string;
  email: string;
  size?: 'sm' | 'lg';
}) {
  const [imageError, setImageError] = useState(false);
  const label = (name || email || 'U').charAt(0).toUpperCase();
  const gradient = getAvatarGradient(name || email || 'U');
  const sizeClass = size === 'lg'
    ? 'h-24 w-24 text-3xl rounded-2xl'
    : 'h-10 w-10 text-base rounded-xl';

  if (avatarUrl && !imageError) {
    return (
      <div className={`relative overflow-hidden ${sizeClass} border-2 border-white/20 shadow-lg`}>
        <Image
          src={avatarUrl}
          alt="Avatar"
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg`}
    >
      {label}
    </div>
  );
}

export function ProfileForm({ userId, initialData }: Props) {
  const [form, setForm] = useState({
    full_name: initialData.full_name,
    bio: initialData.bio,
    country_code: initialData.country_code,
    role: initialData.role,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const router = useRouter();
  const supabase = createClient();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === 'saved') setStatus('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update({
        full_name: form.full_name.trim() || null,
        bio: form.bio.trim() || null,
        country_code: form.country_code || null,
      })
      .eq('id', userId);
    if (error) { setStatus('error'); } else { setStatus('saved'); router.refresh(); }
  }



  const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15';

  return (
    <div className="space-y-6">

      {/* ── Tarjeta de avatar ──────────────────────────── */}
      <div className="flex items-center gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <AvatarDisplay
          avatarUrl={initialData.avatar_url}
          name={form.full_name}
          email={initialData.email}
          size="lg"
        />
        <div>
          <p className="text-lg font-bold text-[var(--color-text)]">
            {form.full_name || 'Sin nombre'}
          </p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {initialData.email}
          </p>
        </div>
      </div>

      {/* ── Datos del perfil ───────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-[var(--color-text)]">
          <User className="h-4 w-4 text-[var(--color-primary)]" />
          Información personal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                Nombre completo
              </label>
              <input
                id="full_name" name="full_name" type="text"
                value={form.full_name} onChange={handleChange}
                placeholder="Tu nombre completo"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="country_code" className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                País
              </label>
              <select
                id="country_code" name="country_code"
                value={form.country_code} onChange={handleChange}
                className={inputClass}
              >
                <option value="">Selecciona tu país</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
              Correo electrónico
            </label>
            <input
              type="email" value={initialData.email} disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
              <FileText className="h-3.5 w-3.5" />
              Biografía <span className="font-normal">(opcional)</span>
            </label>
            <textarea
              id="bio" name="bio"
              value={form.bio} onChange={handleChange}
              rows={4}
              placeholder="Cuéntanos un poco sobre ti..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Error al guardar. Inténtalo de nuevo.
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {status === 'saved' && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                ¡Cambios guardados!
              </span>
            )}
            <button
              type="submit"
              disabled={status === 'saving'}
              className="ml-auto flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
