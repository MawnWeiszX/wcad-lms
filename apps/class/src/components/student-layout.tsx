'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Home,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Award,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@wcad/utils/supabase/client';
import { useRouter } from 'next/navigation';


// ── Avatar de letras con gradiente ───────────────────────────
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
  const code = (name || 'U').toUpperCase().charCodeAt(0);
  return AVATAR_GRADIENTS[code % AVATAR_GRADIENTS.length];
}

function SidebarAvatar({ avatarUrl, name, email }: { avatarUrl?: string | null; name: string | null; email: string }) {
  const [imageError, setImageError] = useState(false);
  const label = (name || email || 'U').charAt(0).toUpperCase();
  const gradient = getGradient(name || email || 'U');
  if (avatarUrl && !imageError) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-xl">
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
    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-extrabold text-white select-none`}>
      {label}
    </div>
  );
}

interface Props {
  user: {
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    role?: string;
  };
  children: React.ReactNode;
}

export function StudentLayout({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    setIsCollapsed(collapsed);
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('sidebar-collapsed', String(newVal));
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

  const navLinks = [
    { href: '/dashboard', label: 'Mi Panel', icon: LayoutDashboard },
    { href: '/dashboard/certificates', label: 'Certificados', icon: Award },
    { href: '/profile', label: 'Configuración', icon: Settings },
    { href: '/', label: 'Página de Inicio', icon: Home },
  ];


  return (
    <div className="flex min-h-screen bg-[var(--color-surface-alt)]">
      {/* ── SIDEBAR DESKTOP ──────────────────────────────────── */}
      <aside className={`relative hidden shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
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

        <div className="flex h-full flex-col justify-between p-4 transition-all duration-300">
          {/* Top section: Logo & Navigation */}
          <div className="space-y-8">
            {/* Logo */}
            <Link href="/" className={`flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
              <Image src="/logo.webp" alt="WCAD Logo" width={36} height={36} className="h-9 w-auto shrink-0 object-contain" />
              {!isCollapsed && (
                <div className="animate-fade-in">
                  <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">WCAD</span>
                  <span className="ml-1 text-xs text-[var(--color-text-muted)]">CLASS</span>
                </div>
              )}
            </Link>

            {/* Links */}
            <nav className="space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    title={isCollapsed ? label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isCollapsed ? 'justify-center px-0' : ''
                    } ${
                      isActive
                        ? 'bg-[var(--color-accent-bg)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="animate-fade-in">{label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom section: Theme, User Info & Logout */}
          <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                  {!isCollapsed && <span className="animate-fade-in">Modo claro</span>}
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 text-indigo-500 shrink-0" />
                  {!isCollapsed && <span className="animate-fade-in">Modo oscuro</span>}
                </>
              )}
            </button>

            {/* User card info */}
            <div className={`flex items-center gap-3 px-2 py-1 ${isCollapsed ? 'justify-center px-0' : ''}`}>
              <SidebarAvatar avatarUrl={user.avatarUrl} name={user.name} email={user.email} />
              {!isCollapsed && (
                <div className="min-w-0 flex-1 animate-fade-in">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {user.name ?? 'Estudiante'}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">
                    {user.email}
                  </p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title={isCollapsed ? 'Cerrar sesión' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">Cerrar sesión</span>}
            </button>

          </div>
        </div>
      </aside>

      {/* ── MOBILE HEADER & SIDEBAR ────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 backdrop-blur-lg lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.webp" alt="WCAD Logo" width={32} height={32} className="h-8 w-auto object-contain" />
            <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">WCAD</span>
          </Link>

          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile drawer backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile drawer panel */}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-64 transform border-l border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl transition-transform duration-300 lg:hidden ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-6">
              {/* Close Button & Logo */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image src="/logo.webp" alt="WCAD Logo" width={32} height={32} className="h-8 w-auto object-contain" />
                  <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">WCAD</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[var(--color-accent-bg)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom tools */}
            <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span>Modo claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 text-indigo-500" />
                    <span>Modo oscuro</span>
                  </>
                )}
              </button>

              {/* User info */}
              <div className="flex items-center gap-3 px-2">
                <SidebarAvatar avatarUrl={user.avatarUrl} name={user.name} email={user.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[var(--color-text)]">
                    {user.name ?? 'Estudiante'}
                  </p>
                  <p className="truncate text-[10px] text-[var(--color-text-secondary)]">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar sesión</span>
              </button>

            </div>
          </div>
        </div>

        {/* Page Content area */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-surface-alt)]">
          {children}
        </main>
      </div>
    </div>
  );
}
