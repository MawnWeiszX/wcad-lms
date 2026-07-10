'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@wcad/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Upload, Play, Trash2, CheckCircle2, AlertCircle,
  Loader2, Save, Clock, Globe, Lock, ExternalLink, Info,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration_seconds: number;
  is_free: boolean;
  bunny_video_id: string | null;
}

interface Props {
  lesson: Lesson;
  bunnyConfigured: boolean;
  bunnyLibraryId: string;
}

type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'processing' | 'done' | 'error';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LessonEditor({ lesson, bunnyConfigured, bunnyLibraryId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: lesson.title,
    duration_seconds: lesson.duration_seconds,
    is_free: lesson.is_free,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [videoId, setVideoId] = useState(lesson.bunny_video_id);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Guardar info de la lección ─────────────────────────────
  async function saveLesson() {
    setSaving(true);
    setSaved(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase
      .from('lessons')
      .update({
        title: form.title.trim(),
        duration_seconds: form.duration_seconds,
        is_free: form.is_free,
      })
      .eq('id', lesson.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  // ── Subida de video a Bunny.net ────────────────────────────
  const uploadVideo = useCallback(async (file: File) => {
    if (!bunnyConfigured) return;
    setUploadStatus('preparing');
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 1. Crear video en Bunny y obtener URL de subida
      const res = await fetch('/api/bunny/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, lessonId: lesson.id }),
      });

      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        throw new Error(error);
      }

      const { videoId: newVideoId, uploadUrl, signature, expirationTime } = await res.json() as {
        videoId: string;
        uploadUrl: string;
        signature: string;
        expirationTime: number;
      };

      // 2. Subir el archivo usando XMLHttpRequest para progreso real
      setUploadStatus('uploading');
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        // Headers requeridos por Bunny TUS
        xhr.setRequestHeader('AuthorizationSignature', signature);
        xhr.setRequestHeader('AuthorizationExpire', String(expirationTime));
        xhr.setRequestHeader('VideoId', newVideoId);
        xhr.setRequestHeader('LibraryId', bunnyLibraryId);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Error de red'));
        xhr.send(file);
      });

      // 3. Guardar videoId en la lección
      setUploadStatus('processing');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      await supabase
        .from('lessons')
        .update({ bunny_video_id: newVideoId })
        .eq('id', lesson.id);

      setVideoId(newVideoId);
      setUploadStatus('done');
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error desconocido');
      setUploadStatus('error');
    }
  }, [bunnyConfigured, form.title, lesson.id, bunnyLibraryId, router]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadVideo(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) uploadVideo(file);
  }

  // ── Eliminar video ─────────────────────────────────────────
  async function removeVideo() {
    if (!confirm('¿Eliminar el video de esta lección?')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase
      .from('lessons')
      .update({ bunny_video_id: null })
      .eq('id', lesson.id);
    setVideoId(null);
    setUploadStatus('idle');
    router.refresh();
  }

  const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--color-text)]';

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Columna izquierda: Info de la lección */}
      <div className="space-y-5 lg:col-span-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="mb-5 font-semibold text-[var(--color-text)]">Información</h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Título de la lección</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className={inputClass}
                placeholder="Ej: Introducción a React"
              />
            </div>

            <div>
              <label className={labelClass}>
                Duración{' '}
                <span className="font-normal text-[var(--color-text-muted)]">
                  (se detecta automáticamente al subir el video)
                </span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="number"
                  min="0"
                  value={form.duration_seconds}
                  onChange={(e) => setForm((p) => ({ ...p, duration_seconds: parseInt(e.target.value) || 0 }))}
                  className={`${inputClass} pl-10`}
                  placeholder="Segundos"
                />
              </div>
              {form.duration_seconds > 0 && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  = {formatDuration(form.duration_seconds)}
                </p>
              )}
            </div>

            {/* Toggle libre */}
            <div>
              <label className={labelClass}>Acceso</label>
              <div className="flex gap-3">
                {[
                  { value: true, label: 'Lección gratis', icon: Globe, desc: 'Visible sin inscripción' },
                  { value: false, label: 'Requiere inscripción', icon: Lock, desc: 'Solo estudiantes' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, is_free: value }))}
                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                      form.is_free === value
                        ? 'border-[var(--color-primary)] bg-[var(--color-accent-bg)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${form.is_free === value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                    <span className={`text-xs font-medium ${form.is_free === value ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guardar */}
          <button
            onClick={saveLesson}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-60"
          >
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : saved
              ? <CheckCircle2 className="h-4 w-4" />
              : <Save className="h-4 w-4" />}
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Columna derecha: Video */}
      <div className="lg:col-span-3 space-y-5">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <h2 className="mb-1 font-semibold text-[var(--color-text)]">Video de la lección</h2>
          <p className="mb-5 text-sm text-[var(--color-text-muted)]">
            Formatos: MP4, MOV, AVI, MKV. Máximo 20 GB por video.
          </p>

          {/* Banner: Bunny no configurado */}
          {!bunnyConfigured && (
            <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Bunny.net no configurado</p>
                <p className="mt-1 text-xs text-amber-700">
                  La subida de videos estará disponible cuando agregues{' '}
                  <code className="rounded bg-amber-100 px-1">BUNNY_API_KEY</code> y{' '}
                  <code className="rounded bg-amber-100 px-1">BUNNY_LIBRARY_ID</code> en{' '}
                  <code className="rounded bg-amber-100 px-1">apps/portal/.env.local</code>.
                  Todo lo demás del editor ya funciona.
                </p>
              </div>
            </div>
          )}

          {/* Video existente */}
          {videoId && (
            <div className="mb-5 overflow-hidden rounded-xl border border-[var(--color-border)]">
              <div className="aspect-video bg-zinc-950">
                {bunnyLibraryId ? (
                  <iframe
                    src={`https://iframe.mediadelivery.net/embed/${bunnyLibraryId}/${videoId}`}
                    className="h-full w-full"
                    allowFullScreen
                    allow="accelerometer; autoplay"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Play className="h-12 w-12 text-white/30" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between bg-[var(--color-surface-alt)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-[var(--color-text)]">Video subido</span>
                  <code className="ml-1 rounded bg-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
                    {videoId}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  {bunnyLibraryId && (
                    <a
                      href={`https://dash.bunny.net/stream/${bunnyLibraryId}/videos/${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Bunny
                    </a>
                  )}
                  <button
                    onClick={removeVideo}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zona de subida */}
          {!videoId && (
            <>
              {/* Drag & drop */}
              {(uploadStatus === 'idle' || uploadStatus === 'error') && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-14 text-center transition-all ${
                    !bunnyConfigured
                      ? 'border-[var(--color-border)] opacity-50 cursor-not-allowed'
                      : dragOver
                      ? 'border-[var(--color-primary)] bg-[var(--color-accent-bg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-alt)] cursor-pointer'
                  }`}
                  onClick={() => bunnyConfigured && fileInputRef.current?.click()}
                >
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${dragOver ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface-alt)]'}`}>
                    <Upload className={`h-8 w-8 ${dragOver ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {bunnyConfigured
                        ? 'Arrastra tu video aquí o haz clic para seleccionar'
                        : 'Subida disponible cuando configures Bunny.net'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      MP4, MOV, AVI, MKV — Máximo 20 GB
                    </p>
                  </div>
                  {bunnyConfigured && (
                    <button
                      type="button"
                      className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
                    >
                      Seleccionar video
                    </button>
                  )}
                </div>
              )}

              {/* Error de subida */}
              {uploadStatus === 'error' && uploadError && (
                <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Error al subir</p>
                    <p className="mt-0.5 text-xs text-red-600">{uploadError}</p>
                    <button
                      onClick={() => setUploadStatus('idle')}
                      className="mt-2 text-xs font-medium text-red-700 underline"
                    >
                      Intentar de nuevo
                    </button>
                  </div>
                </div>
              )}

              {/* Progreso de subida */}
              {(uploadStatus === 'preparing' || uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {uploadStatus === 'preparing'
                          ? 'Preparando subida...'
                          : uploadStatus === 'uploading'
                          ? 'Subiendo video...'
                          : 'Procesando en Bunny.net...'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-primary)]">
                      {uploadStatus === 'uploading' ? `${uploadProgress}%` : ''}
                    </span>
                  </div>

                  {uploadStatus === 'uploading' && (
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  {uploadStatus === 'processing' && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Bunny.net está procesando el video. Puede tomar unos minutos.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Info de Bunny */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            ¿Cómo funciona la subida?
          </p>
          <ol className="space-y-2 text-xs text-[var(--color-text-secondary)]">
            {[
              'El video se sube directamente a Bunny.net Stream (no pasa por tu servidor)',
              'Bunny procesa el video y lo convierte a múltiples resoluciones (360p, 720p, 1080p)',
              'El aula usa URLs firmadas con expiración para proteger el contenido',
              'Los trailers públicos usan URL pública sin firma',
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
