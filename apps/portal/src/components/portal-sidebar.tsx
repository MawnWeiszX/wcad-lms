'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  CreditCard,
} from 'lucide-react';
import { createClient } from '@wcad/utils/supabase/client';
import { useRouter } from 'next/navigation';

// ── Avatar de letras ──────────────────────────────────────────
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

function SidebarAvatar({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  const [imageError, setImageError] = useState(false);
  const label = (name || 'P').charAt(0).toUpperCase();
  const code = label.charCodeAt(0);
  const gradient = AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
  if (avatarUrl && !imageError) {
    return (
      <div className="relative h-9 w-9 overflow-hidden rounded-full">
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
    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-extrabold text-white select-none`}>
      {label}
    </div>
  );
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface Props {
  profile: Profile | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { href: '/courses', icon: BookOpen, label: 'Mis cursos' },
  { href: '/payments', icon: CreditCard, label: 'Pagos' },
  { href: '/students', icon: Users, label: 'Estudiantes' },
  { href: '/analytics', icon: BarChart3, label: 'Estadísticas' },
  { href: '/settings', icon: Settings, label: 'Configuración' },
];

export function PortalSidebar({ profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const classUrl = process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000';
  const [studentUrl] = useState(`${classUrl}/dashboard`);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const collapsed = localStorage.getItem('portal-sidebar-collapsed') === 'true';
    setIsCollapsed(collapsed);
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('portal-sidebar-collapsed', String(newVal));
  };

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    // studentUrl is now set via env var, no runtime detection needed
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`${classUrl}/`);
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Profesor';

  return (
    <aside className={`relative flex shrink-0 flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)] text-[var(--color-text)] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Toggle button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3.5 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-md hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all cursor-pointer hover:scale-105 active:scale-95"
        aria-label={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Logo */}
      <Link href="/dashboard" className={`flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-5 ${isCollapsed ? 'justify-center' : ''}`}>
        <Image src="/logo.webp" alt="WCAD Logo" width={36} height={36} className="h-9 w-auto shrink-0 object-contain" />
        {!isCollapsed && (
          <div className="animate-fade-in">
            <span className="text-base font-bold tracking-tight text-[var(--color-text)]">WCAD</span>
            <span className="ml-1.5 rounded bg-[var(--color-accent-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
              Portal
            </span>
          </div>
        )}
      </Link>

      {/* Botón nuevo curso */}
      <div className="px-4 pt-5">
        <Link
          href="/courses/new"
          title={isCollapsed ? "Nuevo curso" : undefined}
          className={`flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] ${
            isCollapsed ? 'px-0' : 'px-4'
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="animate-fade-in">Nuevo curso</span>}
        </Link>
      </div>

      {/* Navegación */}
      <nav className="mt-5 flex-1 space-y-1 px-3">
        {/* Enlace para volver a la vista del estudiante */}
        <a
          href={studentUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={isCollapsed ? "Ver como Estudiante ↗" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            isCollapsed ? 'justify-center px-0' : ''
          } text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]`}
        >
          <GraduationCap className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          {!isCollapsed && <span className="animate-fade-in">Ver como Estudiante ↗</span>}
        </a>

        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-[var(--color-accent-bg)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Perfil y logout */}
      <div className="border-t border-[var(--color-border)] p-4 space-y-4">
        {/* Selector de tema */}
        <button
          onClick={toggleTheme}
          title={isCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-500 shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">Modo claro</span>}
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">Modo oscuro</span>}
            </>
          )}
        </button>

        {/* Info usuario */}
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="shrink-0 overflow-hidden">
            <SidebarAvatar avatarUrl={profile?.avatar_url} name={profile?.full_name ?? firstName} />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">{profile?.full_name ?? 'Profesor'}</p>
              <p className="text-xs text-[var(--color-text-secondary)] capitalize">{profile?.role ?? 'teacher'}</p>
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar sesión" : undefined}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/5 transition-colors ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span className="animate-fade-in">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
