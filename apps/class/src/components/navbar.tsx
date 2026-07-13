'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Menu, X, Sun, Moon, User, LayoutDashboard, LogOut, ChevronDown, BookOpen, ShoppingCart } from 'lucide-react';

import { useUser } from '@/components/user-context';
import { ModeToggle } from '@/components/mode-toggle';
import { createClient } from '@wcad/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { AuthModal } from '@/components/auth-modal';


interface Props {
  user?: { email: string; name: string | null; avatarUrl?: string | null; role?: string } | null;
}

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

function NavbarAvatar({ avatarUrl, name, email }: { avatarUrl?: string | null; name: string | null; email: string }) {
  const [imageError, setImageError] = useState(false);
  const label = (name || email || 'U').charAt(0).toUpperCase();
  const gradient = getGradient(name || email || 'U');
  if (avatarUrl && !imageError) {
    return (
      <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/20 shadow-sm">
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
    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-extrabold text-white select-none shadow-sm`}>
      {label}
    </div>
  );
}

export function Navbar({ user: initialUser }: Props) {
  const { user: ctxUser, role, modoActivo } = useUser();
  const { items } = useCart();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const user = ctxUser ? {
    email: ctxUser.email,
    name: ctxUser.name,
    avatarUrl: ctxUser.avatarUrl,
    role: role || undefined
  } : initialUser;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClose = () => setDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [dropdownOpen]);

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

  const navLinks: { href: string; label: string; external?: boolean }[] = [
    { href: '/courses', label: 'Cursos' },
    { href: '/#servicios', label: 'Servicios' },
    { href: '/#beneficios', label: 'Beneficios' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.webp" alt="WCAD Logo" width={36} height={36} className="h-9 w-auto object-contain" />
            <div>
              <span className="text-xl font-bold tracking-tight text-[var(--color-text)]">WCAD</span>
              <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">Service</span>
            </div>
          </Link>

          {/* Links escritorio */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(({ href, label, external }) => {
              const LinkComponent = href.startsWith('/') ? Link : 'a';
              return (
                <LinkComponent key={label} href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]">
                  {label}
                  {external && <ExternalLink className="h-3 w-3" />}
                </LinkComponent>
              );
            })}
          </div>

          {/* Acciones escritorio */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/checkout"
              className="relative mr-1 rounded-xl p-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all active:scale-95 cursor-pointer"
              aria-label="Ver carrito"
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white ring-2 ring-[var(--color-surface)]">
                  {items.length}
                </span>
              )}
            </Link>
            <button
              onClick={toggleTheme}
              className="mr-1 rounded-xl p-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all active:scale-95 cursor-pointer"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 animate-fade-in" />
              ) : (
                <Moon className="h-5 w-5 animate-fade-in" />
              )}
            </button>
             {user ? (
               <div className="relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                 <button
                   onClick={() => setDropdownOpen((p) => !p)}
                   className="flex items-center gap-1.5 rounded-xl p-1 hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer select-none"
                 >
                   <NavbarAvatar avatarUrl={user.avatarUrl} name={user.name} email={user.email} />
                   <ChevronDown className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                 </button>

                 {/* Dropdown de opciones */}
                 {dropdownOpen && (
                   <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl ring-1 ring-black/5 z-50">
                     <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                       <p className="truncate text-sm font-bold text-[var(--color-text)]">
                         {user.name ?? 'Estudiante'}
                       </p>
                       <p className="truncate text-xs text-[var(--color-text-secondary)]">
                         {user.email}
                       </p>
                     </div>

                     <Link
                       href="/profile"
                       className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <User className="h-4 w-4" />
                       Editar perfil
                     </Link>

                     <Link
                       href="/dashboard"
                       className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                       onClick={() => setDropdownOpen(false)}
                     >
                       <LayoutDashboard className="h-4 w-4" />
                       Class
                     </Link>

                      {role === 'profesor' && (
                        <div className="px-2 py-1.5 border-b border-[var(--color-border)] mb-1">
                          <ModeToggle />
                        </div>
                      )}

                      {role === 'profesor' && modoActivo === 'profesor' && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3001'}/dashboard`}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <BookOpen className="h-4 w-4" />
                          Panel de Profesor
                        </a>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/5 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                   </div>
                 )}
               </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  id="btn-login"
                  className="rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.98] shadow-md shadow-[var(--color-primary)]/20 transition-all cursor-pointer"
                >
                  Ingresar a Class
                </button>
              )}
           </div>
 
           {/* Menú móvil */}
           <div className="flex items-center gap-1 md:hidden">
             <Link
               href="/checkout"
               className="relative rounded-xl p-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all active:scale-95 cursor-pointer"
               aria-label="Ver carrito"
             >
               <ShoppingCart className="h-5 w-5" />
               {items.length > 0 && (
                 <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white ring-2 ring-[var(--color-surface)]">
                   {items.length}
                 </span>
               )}
             </Link>
             <button
               onClick={toggleTheme}
               className="rounded-xl p-2.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all active:scale-95 cursor-pointer"
               aria-label="Cambiar tema"
             >
               {theme === 'dark' ? (
                 <Sun className="h-5 w-5 animate-fade-in" />
               ) : (
                 <Moon className="h-5 w-5 animate-fade-in" />
               )}
             </button>
             <button
               className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
               onClick={() => setMobileOpen((p) => !p)}
               aria-label="Menú"
             >
               {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
             </button>
           </div>
         </div>
 
         {/* Menú móvil desplegable */}
         {mobileOpen && (
           <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 md:hidden">
             <div className="space-y-1">
               {navLinks.map(({ href, label, external }) => {
                 const LinkComponent = href.startsWith('/') ? Link : 'a';
                 return (
                   <LinkComponent key={label} href={href}
                     target={external ? '_blank' : undefined}
                     rel={external ? 'noopener noreferrer' : undefined}
                     onClick={() => setMobileOpen(false)}
                     className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]">
                     {label}
                     {external && <ExternalLink className="h-3 w-3" />}
                   </LinkComponent>
                 );
               })}
             </div>
             <div className="mt-4 border-t border-[var(--color-border)] pt-4 space-y-2.5">
               {user ? (
                 <>
                   <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)]">
                     <NavbarAvatar avatarUrl={user.avatarUrl} name={user.name} email={user.email} />
                     <div className="min-w-0 flex-1">
                       <p className="truncate text-xs font-bold text-[var(--color-text)]">
                         {user.name ?? 'Estudiante'}
                       </p>
                       <p className="truncate text-[10px] text-[var(--color-text-secondary)]">
                         {user.email}
                       </p>
                     </div>
                   </div>

                   <Link
                     href="/profile"
                     onClick={() => setMobileOpen(false)}
                     className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all"
                   >
                     <User className="h-4 w-4" />
                     Editar perfil
                   </Link>

                   <Link
                     href="/dashboard"
                     onClick={() => setMobileOpen(false)}
                     className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all"
                   >
                     <LayoutDashboard className="h-4 w-4" />
                     Class
                   </Link>

                    {role === 'profesor' && (
                      <div className="px-1 py-1">
                        <ModeToggle />
                      </div>
                    )}

                    {role === 'profesor' && modoActivo === 'profesor' && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3001'}/dashboard`}
                        onClick={() => setMobileOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-all"
                      >
                        <BookOpen className="h-4 w-4" />
                        Panel de Profesor
                      </a>
                    )}

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                 </>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white shadow-md shadow-[var(--color-primary)]/20 transition-all cursor-pointer"
                  >
                    Ingresar a Class
                  </button>
                )}
            </div>
          </div>
        )}
      </nav>
      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo="/dashboard"
      />
    </>
  );
}
