'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollHelper() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Manejar desplazamiento si el usuario llega con un hash en la URL
    const checkAndScroll = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const id = hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            const yOffset = -80; // Offset para evitar la barra de navegación fija
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // Limpiar el hash de la barra de direcciones sin recargar
            window.history.replaceState(null, '', window.location.pathname);
          }, 200); // Delay suficiente para asegurar el renderizado
        }
      }
    };

    checkAndScroll();

    // Escuchar también el evento hashchange nativo por compatibilidad
    window.addEventListener('hashchange', checkAndScroll);
    return () => {
      window.removeEventListener('hashchange', checkAndScroll);
    };
  }, [pathname]); // Se ejecuta de nuevo cuando cambia la página

  useEffect(() => {
    // 2. Interceptar clics en enlaces locales para desplazarse suavemente
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      let targetId = '';
      if (href.startsWith('#') && href.length > 1) {
        targetId = href.substring(1);
      } else if (href.startsWith('/#') && href.length > 2 && window.location.pathname === '/') {
        targetId = href.substring(2);
      }

      if (targetId) {
        const element = document.getElementById(targetId);
        if (element) {
          e.preventDefault();
          const yOffset = -80;
          const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return null;
}
