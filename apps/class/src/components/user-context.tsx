'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@wcad/utils/supabase/client';

export type Role = 'alumno' | 'profesor';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface DbProfile {
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface UserContextProps {
  user: UserProfile | null;
  role: Role | null;
  modoActivo: Role;
  setModoActivo: (modo: Role) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [modoActivo, setModoActivoState] = useState<Role>('alumno');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function initUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', authUser.id)
            .single();

          const profile = data as unknown as DbProfile | null;

          const dbRole = profile?.role === 'profesor' ? 'profesor' : 'alumno';
          
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            name: profile?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email ?? null,
            avatarUrl: profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
          });
          setRole(dbRole);

          // Obtener modo inicial guardado en localStorage o por defecto por rol
          const savedModo = localStorage.getItem('modoActivo') as Role | null;
          let initialModo: Role = 'alumno';
          if (dbRole === 'profesor') {
            initialModo = savedModo === 'alumno' ? 'alumno' : 'profesor';
          }

          setModoActivoState(initialModo);
          localStorage.setItem('modoActivo', initialModo);

          // Configurar la cookie compartida para accesibilidad en middleware
          const hasSharedDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('wcadservice.com');
          const cookieDomain = (process.env.NODE_ENV === 'production' && hasSharedDomain) ? '; domain=.wcadservice.com; path=/' : '; path=/';
          document.cookie = `modoActivo=${initialModo}${cookieDomain}; max-age=31536000; SameSite=Lax`;
        } else {
          setUser(null);
          setRole(null);
          setModoActivoState('alumno');
          localStorage.removeItem('modoActivo');
          const hasSharedDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('wcadservice.com');
          document.cookie = `modoActivo=alumno${(process.env.NODE_ENV === 'production' && hasSharedDomain) ? '; domain=.wcadservice.com' : ''}; path=/; max-age=0; SameSite=Lax`;
        }
      } catch (err) {
        console.error('Error loading session profile:', err);
      } finally {
        setLoading(false);
      }
    }

    initUser();

    // Suscribirse a los cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        initUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setModoActivoState('alumno');
        localStorage.removeItem('modoActivo');
        const hasSharedDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('wcadservice.com');
        const cookieDomain = (process.env.NODE_ENV === 'production' && hasSharedDomain) ? '; domain=.wcadservice.com; path=/' : '; path=/';
        document.cookie = `modoActivo=alumno${cookieDomain}; max-age=0; SameSite=Lax`;
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const setModoActivo = (modo: Role) => {
    if (role === 'profesor') {
      setModoActivoState(modo);
      localStorage.setItem('modoActivo', modo);
      const hasSharedDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('wcadservice.com');
      const cookieDomain = (process.env.NODE_ENV === 'production' && hasSharedDomain) ? '; domain=.wcadservice.com; path=/' : '; path=/';
      document.cookie = `modoActivo=${modo}${cookieDomain}; max-age=31536000; SameSite=Lax`;
    }
  };

  return (
    <UserContext.Provider value={{ user, role, modoActivo, setModoActivo, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
