import {
  BookOpen,
  Play,
  Users,
  Award,
  Clock,
  ChevronRight,
  Star,
  Monitor,
  MessageCircle,
  FileText,
  Droplets,
  Waves,
  CloudRain,
  Mail,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Globe,
  Facebook,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { HeroLoginButton } from '@/components/hero-login-button';

// ── Datos reales de WCAD ────────────────────────────────────

const COURSES = [
  {
    id: '1',
    title: 'Modelamiento de Redes de Distribución de Agua Potable',
    slug: 'redes-distribucion-agua-potable',
    shortDescription:
      'Aprende a modelar y analizar redes de distribución de agua potable usando software especializado. Diseño hidráulico, calibración y optimización.',
    price: 0,
    currency: 'PEN',
    isFree: false,
    level: 'intermediate' as const,
    totalDurationSeconds: 36000,
    studentsCount: 0,
    teacher: { fullName: 'Instructor WCAD' },
    category: 'Agua Potable',
    icon: Droplets,
    gradient: 'from-blue-500 to-cyan-500',
    lightGradient: 'from-blue-50 to-cyan-50',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    accent: '#3b82f6',
    tag: 'Más popular',
  },
  {
    id: '2',
    title: 'Construcción de Red de Alcantarillado Sanitario',
    slug: 'redes-alcantarillado-sanitario',
    shortDescription:
      'Domina el diseño y construcción de redes de alcantarillado sanitario. Normas técnicas, cálculo hidráulico, perfiles y presupuestos de obra.',
    price: 0,
    currency: 'PEN',
    isFree: false,
    level: 'intermediate' as const,
    totalDurationSeconds: 32400,
    studentsCount: 0,
    teacher: { fullName: 'Instructor WCAD' },
    category: 'Saneamiento',
    icon: Waves,
    gradient: 'from-teal-500 to-emerald-500',
    lightGradient: 'from-teal-50 to-emerald-50',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-100',
    accent: '#14b8a6',
    tag: null,
  },
  {
    id: '3',
    title: 'Red de Drenaje Pluvial Urbano e Hidrología',
    slug: 'red-drenaje-pluvial-urbano',
    shortDescription:
      'Diseño de sistemas de drenaje pluvial urbano. Hidrología aplicada, caudales de diseño, redes de conductos y estructuras hidráulicas.',
    price: 0,
    currency: 'PEN',
    isFree: false,
    level: 'intermediate' as const,
    totalDurationSeconds: 28800,
    studentsCount: 0,
    teacher: { fullName: 'Instructor WCAD' },
    category: 'Drenaje Pluvial',
    icon: CloudRain,
    gradient: 'from-violet-500 to-purple-500',
    lightGradient: 'from-violet-50 to-purple-50',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-100',
    accent: '#8b5cf6',
    tag: null,
  },
];

const SERVICES = [
  {
    icon: GraduationCap,
    title: 'Formación Online',
    description: 'Cursos en línea sobre ingeniería hidráulica y sanitaria. Accede desde cualquier lugar a tu propio ritmo.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: Users,
    title: 'Formación Presencial',
    description: 'Talleres y cursos presenciales con instructores expertos en ingeniería de redes hidráulicas.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: ShieldCheck,
    title: 'Consultoría y Asesoría',
    description: 'Asesoramiento técnico especializado en diseño, modelamiento y construcción de sistemas hidráulicos.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: FileText,
    title: 'Diplomados',
    description: 'Programas de formación intensiva con certificación en áreas de ingeniería hidráulica y sanitaria.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

const BENEFITS = [
  {
    icon: Monitor,
    title: 'Campus Virtual 24/7',
    description: 'Accede a los materiales del curso las 24 horas del día, los 7 días de la semana desde cualquier dispositivo.',
  },
  {
    icon: MessageCircle,
    title: 'Tutor Personal',
    description: 'Respuesta en menos de 24 horas. Tutorial personalizado al finalizar el curso y múltiples canales de comunicación.',
  },
  {
    icon: BookOpen,
    title: 'Materiales de Alta Calidad',
    description: 'Contenidos prácticos, guías didácticas, manuales con ilustraciones, videos HD y ejercicios resueltos.',
  },
  {
    icon: Award,
    title: 'Certificado de Finalización',
    description: 'Recibe un certificado digital avalado por WCAD al completar satisfactoriamente cada curso o diplomado.',
  },
];

// ── Helpers ─────────────────────────────────────────────────
function formatLevel(level: string): string {
  return { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }[level] ?? level;
}

function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden pb-24 pt-36 sm:pb-32 sm:pt-44">
      {/* Fondo decorativo multicapa */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Blob principal */}
        <div className="absolute left-1/2 top-0 h-[700px] w-[1200px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-gradient-to-b from-[var(--color-primary)]/8 via-purple-500/4 to-transparent blur-[100px]" />
        {/* Blob secundario derecho */}
        <div className="absolute -right-40 top-1/3 h-[400px] w-[500px] rounded-full bg-gradient-to-l from-cyan-400/8 to-blue-500/6 blur-[80px]" />
        {/* Blob izquierdo */}
        <div className="absolute -left-32 bottom-0 h-[350px] w-[450px] rounded-full bg-gradient-to-r from-violet-500/6 to-transparent blur-[80px]" />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Orbes flotantes decorativos */}
      <div className="pointer-events-none absolute left-[8%] top-40 h-3 w-3 animate-float rounded-full bg-[var(--color-primary)]/40 blur-[1px] animation-delay-200" />
      <div className="pointer-events-none absolute right-[12%] top-56 h-2 w-2 animate-float rounded-full bg-cyan-400/50 animation-delay-400" />
      <div className="pointer-events-none absolute left-[18%] bottom-32 h-4 w-4 animate-float rounded-full bg-violet-400/30 blur-[1px] animation-delay-300" />
      <div className="pointer-events-none absolute right-[20%] bottom-40 h-2.5 w-2.5 animate-float rounded-full bg-[var(--color-primary)]/35 animation-delay-100" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">

          {/* Título principal */}
          <h1 className="animate-fade-in-up animation-delay-100 text-5xl font-extrabold leading-[1.08] tracking-tight text-[var(--color-text)] sm:text-6xl lg:text-7xl">
            Formación en{' '}
            <span className="text-gradient">
              Ingeniería Hidráulica
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="animate-fade-in-up animation-delay-200 mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)] sm:text-xl">
            Cursos y diplomados en redes de agua potable, alcantarillado sanitario y drenaje pluvial.
            Aprende con expertos y avanza en tu carrera de ingeniería.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/courses"
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--color-primary)]/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-xl hover:shadow-[var(--color-primary)]/40 active:scale-[0.98]"
            >
              <span className="relative z-10">Ver cursos disponibles</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-3.5 text-base font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] active:scale-[0.98]"
              >
                Ir a Class →
              </Link>
            ) : (
              <HeroLoginButton />
            )}
          </div>

          {/* Stats bar */}
          <div className="animate-fade-in-up animation-delay-400 mt-14 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-10 sm:grid-cols-4">
            {[
              { icon: BookOpen, value: '3+', label: 'Cursos especializados' },
              { icon: Globe, value: '24/7', label: 'Campus virtual' },
              { icon: Award, value: '100%', label: 'Certificación digital' },
              { icon: Star, value: '5.0', label: 'Tutores expertos', gold: true },
            ].map(({ icon: Icon, value, label, gold }) => (
              <div key={label} className="flex flex-col items-center gap-1 text-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gold ? 'bg-amber-50 text-amber-500' : 'bg-[var(--color-accent-bg)] text-[var(--color-primary)]'} mx-auto mb-1`}>
                  <Icon className={`h-5 w-5 ${gold ? 'fill-amber-400 text-amber-500' : ''}`} />
                </div>
                <strong className="text-xl font-extrabold text-[var(--color-text)]">{value}</strong>
                <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Gradientes de color rotativos para cursos dinámicos
const CARD_THEMES = [
  { gradient: 'from-blue-500 to-cyan-500', light: 'from-blue-50 to-cyan-50', accent: '#3b82f6', iconColor: 'text-blue-600', iconBg: 'bg-blue-100' },
  { gradient: 'from-teal-500 to-emerald-500', light: 'from-teal-50 to-emerald-50', accent: '#14b8a6', iconColor: 'text-teal-600', iconBg: 'bg-teal-100' },
  { gradient: 'from-violet-500 to-purple-500', light: 'from-violet-50 to-purple-50', accent: '#8b5cf6', iconColor: 'text-violet-600', iconBg: 'bg-violet-100' },
  { gradient: 'from-amber-500 to-orange-500', light: 'from-amber-50 to-orange-50', accent: '#f59e0b', iconColor: 'text-amber-600', iconBg: 'bg-amber-100' },
  { gradient: 'from-rose-500 to-pink-500', light: 'from-rose-50 to-pink-50', accent: '#f43f5e', iconColor: 'text-rose-600', iconBg: 'bg-rose-100' },
  { gradient: 'from-indigo-500 to-blue-500', light: 'from-indigo-50 to-blue-50', accent: '#6366f1', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100' },
];

interface DbCourse {
  id: string; title: string; slug: string;
  short_description: string | null; thumbnail_url: string | null;
  level: string; total_duration_seconds: number; students_count: number;
  category: { name: string } | { name: string }[] | null;
}

function CoursesSection({ dbCourses }: { dbCourses: DbCourse[] }) {
  // Si hay cursos reales publicados, usamos esos. Si no, mostramos los estáticos.
  const hasRealCourses = dbCourses.length > 0;

  return (
    <section id="cursos" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-[var(--color-accent-bg)] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Cursos especializados
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            Aprende con los mejores{' '}
            <span className="text-[var(--color-primary)]">contenidos</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--color-text-secondary)]">
            Formación técnica especializada en sistemas hidráulicos y sanitarios urbanos.
          </p>
        </div>

        {hasRealCourses ? (
          /* ── Cursos dinámicos desde la BD ── */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {dbCourses.slice(0, 6).map((course, i) => {
              const theme = CARD_THEMES[i % CARD_THEMES.length];
              const cat = Array.isArray(course.category) ? course.category[0] : course.category;
              const hours = Math.floor(course.total_duration_seconds / 3600);

              return (
                <article
                  key={course.id}
                  className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl"
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  {/* Header con thumbnail o gradiente */}
                  <div className={`relative h-40 overflow-hidden ${!course.thumbnail_url ? `bg-gradient-to-br ${theme.light}` : ''}`}>
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <div className={`absolute right-4 bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${theme.gradient} opacity-15 blur-xl`} />
                        <div className="p-6">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} shadow-lg`}>
                            <BookOpen className="h-7 w-7 text-white" />
                          </div>
                        </div>
                      </>
                    )}
                    {cat && (
                      <div className="absolute left-4 bottom-4">
                        <span className={`rounded-full ${theme.iconBg} ${theme.iconColor} px-2.5 py-0.5 text-xs font-semibold shadow-sm`}>
                          {cat.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-base font-bold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                      {course.title}
                    </h3>
                    {course.short_description && (
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
                        {course.short_description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {hours > 0 ? `${hours}h de contenido` : 'Próximamente'}
                      </span>
                      <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 font-medium">
                        {formatLevel(course.level)}
                      </span>
                    </div>

                    <Link
                      href={`/courses/${course.slug}`}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${theme.gradient} py-3 text-sm font-semibold text-white opacity-90 shadow-md transition-all duration-300 hover:opacity-100 hover:shadow-lg active:scale-[0.98]`}
                      style={{ boxShadow: `0 4px 16px ${theme.accent}35` }}
                    >
                      <Play className="h-4 w-4" />
                      Ver más información
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ── Fallback: cursos estáticos ── */
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course, i) => (
              <article
                key={course.id}
                className="animate-fade-in-up group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-2xl"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {course.tag && (
                  <div className="absolute right-4 top-4 z-10 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                    {course.tag}
                  </div>
                )}
                <div className={`relative h-40 bg-gradient-to-br ${course.lightGradient} p-6`}>
                  <div className={`absolute right-4 bottom-4 h-24 w-24 rounded-full bg-gradient-to-br ${course.gradient} opacity-15 blur-xl`} />
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${course.gradient} shadow-lg`} style={{ boxShadow: `0 8px 24px ${course.accent}40` }}>
                    <course.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className={`mt-3 inline-block rounded-full ${course.iconBg} ${course.iconColor} px-2.5 py-0.5 text-xs font-semibold`}>
                    {course.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-base font-bold leading-snug text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                    {course.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {course.shortDescription}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.floor(course.totalDurationSeconds / 3600)}h de contenido
                    </span>
                    <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 font-medium">
                      {formatLevel(course.level)}
                    </span>
                  </div>
                  <Link
                    href={`/courses/${course.slug}`}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${course.gradient} py-3 text-sm font-semibold text-white opacity-90 shadow-md transition-all duration-300 hover:opacity-100 hover:shadow-lg active:scale-[0.98]`}
                    style={{ boxShadow: `0 4px 16px ${course.accent}35` }}
                  >
                    <Play className="h-4 w-4" />
                    Ver más información
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-3.5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] hover:shadow-md"
          >
            Ver catálogo completo
            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="servicios" className="relative overflow-hidden py-24 sm:py-32">
      {/* Fondo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--color-surface-alt)] via-[var(--color-surface-alt)] to-[var(--color-surface)]" />
      <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[var(--color-primary)]/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full bg-white border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
            Lo que ofrecemos
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
            Una solución{' '}
            <span className="text-[var(--color-primary)]">completa</span>{' '}
            de formación
          </h2>
          <p className="mt-5 text-lg text-[var(--color-text-secondary)]">
            Más que cursos — consultoría, diplomados y formación presencial en ingeniería.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => (
            <div
              key={service.title}
              className="animate-fade-in-up group relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-[var(--color-primary)]/25 hover:shadow-xl"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Glow en hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/0 to-[var(--color-primary)]/0 opacity-0 transition-opacity duration-500 group-hover:from-[var(--color-primary)]/3 group-hover:to-transparent group-hover:opacity-100" />

              <div className={`relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${service.bg} ${service.color} transition-all duration-300 group-hover:scale-110`}>
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="relative text-base font-bold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                {service.title}
              </h3>
              <p className="relative mt-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {service.description}
              </p>

              {/* Arrow indicator */}
              <div className={`mt-5 flex h-7 w-7 items-center justify-center rounded-full ${service.bg} ${service.color} opacity-0 transition-all duration-300 group-hover:opacity-100`}>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  const stats = [
    { value: '3', label: 'Áreas de especialización', sub: 'Agua, alcantarillado y drenaje', gradient: 'from-blue-500 to-cyan-500' },
    { value: '24/7', label: 'Disponibilidad', sub: 'Acceso ilimitado a materiales', gradient: 'from-teal-500 to-emerald-500' },
    { value: '<24h', label: 'Respuesta del tutor', sub: 'Soporte personalizado', gradient: 'from-violet-500 to-purple-500' },
    { value: '100%', label: 'Online', sub: 'Aprende desde cualquier lugar', gradient: 'from-indigo-500 to-blue-600' },
  ];

  return (
    <section id="beneficios" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
          {/* Texto y beneficios */}
          <div>
            <span className="mb-4 inline-block rounded-full bg-[var(--color-accent-bg)] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
              Por qué elegirnos
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl lg:text-5xl">
              ¿Por qué estudiar con{' '}
              <span className="text-[var(--color-primary)]">WCAD</span>?
            </h2>
            <p className="mt-5 text-lg text-[var(--color-text-secondary)]">
              Formación especializada diseñada por y para ingenieros. Contenido práctico, materiales de alta calidad y soporte personalizado.
            </p>

            <div className="mt-10 space-y-5">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.title}
                  className="animate-fade-in-up group flex items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-all duration-300 hover:border-[var(--color-primary)]/25 hover:shadow-md"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-bg)] text-[var(--color-primary)] transition-all duration-300 group-hover:bg-[var(--color-primary)] group-hover:text-white">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">{b.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{b.description}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[var(--color-primary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              ))}
            </div>

            <a
              href="#cursos"
              className="mt-10 inline-flex items-center gap-2.5 rounded-2xl bg-[var(--color-primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-primary)]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-xl"
            >
              Explorar cursos
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-5 lg:mt-12">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="animate-fade-in-up relative overflow-hidden rounded-3xl p-6 text-white"
                style={{
                  animationDelay: `${i * 0.12}s`,
                  background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
                <div className="pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <div className="pointer-events-none absolute -left-2 -top-2 h-16 w-16 rounded-full bg-white/5" />
                <div className="relative">
                  <p className="text-4xl font-extrabold tracking-tight">{stat.value}</p>
                  <p className="mt-2 text-sm font-semibold text-white/90">{stat.label}</p>
                  <p className="mt-1 text-xs text-white/65">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



function ContactBanner() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary)] via-violet-600 to-indigo-700 p-10 text-center sm:p-16">
          {/* Decorations */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/8 blur-xl" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative">
            <span className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80">
              ¿Tienes preguntas?
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Nuestro equipo está listo para asesorarte
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/75">
              Encuentra el curso o diplomado que mejor se adapte a tus necesidades y da el siguiente paso en tu carrera.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://wcadservice.com/contactos/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-[var(--color-primary)] shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              >
                <Mail className="h-4 w-4" />
                Contáctanos
              </a>
              <a
                href="https://www.facebook.com/p/Wcad-Service-100064626012224/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 active:scale-[0.98]"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-alt)] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          {/* Logo y descripción */}
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/logo.webp" alt="WCAD Logo" width={36} height={36} className="h-9 w-auto object-contain" />
              <span className="text-lg font-bold text-[var(--color-text)]">Wcad Service</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Empresa especializada en formación, consultoría y asesoría en ingeniería hidráulica y sanitaria.
            </p>
          </div>

          {/* Cursos */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Cursos</h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-text-secondary)]">
              <li><Link href="/courses/redes-distribucion-agua-potable" className="hover:text-[var(--color-primary)] transition-colors">Redes de Agua Potable</Link></li>
              <li><Link href="/courses/redes-alcantarillado-sanitario" className="hover:text-[var(--color-primary)] transition-colors">Alcantarillado Sanitario</Link></li>
              <li><Link href="/courses/red-drenaje-pluvial-urbano" className="hover:text-[var(--color-primary)] transition-colors">Drenaje Pluvial Urbano</Link></li>
              <li>
                <Link href="/courses" className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors">
                  Ver catálogo completo <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-[var(--color-text)]">Contacto</h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-text-secondary)]">
              <li>
                <a href="https://wcadservice.com/contactos/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
                  <Mail className="h-3.5 w-3.5" /> Formulario de contacto
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/p/Wcad-Service-100064626012224/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-8 sm:flex-row">
          <p className="text-sm text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Wcad Service. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Términos</a>
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Página Principal ────────────────────────────────────────
export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch auth + cursos publicados en paralelo
  const [{ data: { user } }, { data: coursesRaw }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('courses')
      .select('id, title, slug, short_description, thumbnail_url, level, total_duration_seconds, students_count, category:categories(name)')
      .eq('is_published', true)
      .order('students_count', { ascending: false })
      .limit(6),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile: any = null;
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('profiles') as any)
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const userInfo = user ? {
    email: user.email ?? '',
    name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? null,
    avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
    role: profile?.role ?? 'student',
  } : null;

  const dbCourses = (coursesRaw ?? []) as unknown as DbCourse[];

  return (
    <main>
      <Navbar user={userInfo} />
      <Hero isLoggedIn={!!user} />
      <CoursesSection dbCourses={dbCourses} />
      <ServicesSection />
      <BenefitsSection />

      <ContactBanner />
      <Footer />
    </main>
  );
}
