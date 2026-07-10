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
  { code: 'MX', name: 'México' }, { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' }, { code: 'PE', name: 'Perú' },
  { code: 'CL', name: 'Chile' }, { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' }, { code: 'BO', name: 'Bolivia' },
  { code: 'GT', name: 'Guatemala' }, { code: 'DO', name: 'República Dominicana' },
  { code: 'HN', name: 'Honduras' }, { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panamá' }, { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' }, { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' }, { code: 'CA', name: 'Canadá' },
];

// Gradientes asignados por la inicial — consistente por usuario
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

function getGradient(name: string) {
  const code = (name || 'A').toUpperCase().charCodeAt(0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

function LetterAvatar({
  avatarUrl, name, email, size = 'lg',
}: {
  avatarUrl: string | null; name: string; email: string; size?: 'sm' | 'lg';
}) {
  const [imageError, setImageError] = useState(false);
  const label = (name || email || 'U').charAt(0).toUpperCase();
  const gradient = getGradient(name || email || 'U');
  const cls = size === 'lg'
    ? 'h-28 w-28 text-4xl rounded-3xl'
    : 'h-10 w-10 text-base rounded-xl';

  if (avatarUrl && !imageError) {
    return (
      <div className={`relative overflow-hidden ${cls} shadow-lg`}>
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
  return (
    <div className={`${cls} bg-gradient-to-br ${gradient} flex items-center justify-center font-extrabold text-white shadow-lg select-none`}>
      {label}
    </div>
  );
}

export function ProfileSettingsForm({ userId, initialData }: Props) {
  const [form, setForm] = useState({
    full_name: initialData.full_name,
    bio: initialData.bio,
    country_code: initialData.country_code,
    role: initialData.role,
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === 'saved') setStatus('idle');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        bio: form.bio.trim() || null,
        country_code: form.country_code || null,
      })
      .eq('id', userId);
    if (error) { setStatus('error'); } else { setStatus('saved'); router.refresh(); }
  }



  const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none transition-colors';

  return (
    <div className="grid gap-6 lg:grid-cols-3">

      {/* ── Avatar card ───────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <LetterAvatar
          avatarUrl={initialData.avatar_url}
          name={form.full_name}
          email={initialData.email}
          size="lg"
        />
        <div>
          <p className="text-lg font-bold text-[var(--color-text)]">
            {form.full_name || 'Sin nombre'}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            {initialData.email}
          </p>
        </div>


        {/* Descripción del avatar */}
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          Tu avatar se genera automáticamente con la inicial de tu nombre y un color único.
          {initialData.avatar_url && ' (Usando tu foto de Google)'}
        </p>
      </div>

      {/* ── Formulario ────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Información de perfil */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 font-semibold text-[var(--color-text)]">
            <User className="h-4 w-4 text-[var(--color-primary)]" />
            Información de perfil
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Nombre completo
                </label>
                <input
                  name="full_name" type="text" value={form.full_name}
                  onChange={handleChange} placeholder="Tu nombre completo"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
                  País
                </label>
                <select name="country_code" value={form.country_code} onChange={handleChange} className={inputClass}>
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
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <FileText className="h-3.5 w-3.5" />
                Biografía <span className="font-normal">(opcional)</span>
              </label>
              <textarea
                name="bio" value={form.bio} onChange={handleChange} rows={5}
                placeholder="Cuéntales a tus estudiantes sobre ti, tu experiencia y especialidad..."
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
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 animate-fade-in-up">
                  <CheckCircle2 className="h-4 w-4" />
                  Cambios guardados
                </span>
              )}
              <button
                type="submit"
                disabled={status === 'saving'}
                className="ml-auto flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-hover)] disabled:opacity-60 transition-all"
              >
                {status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>


      </div>
    </div>
  );
}
