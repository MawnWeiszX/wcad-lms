import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Wcad Service - Formación En Ingeniería',
    template: '%s | Wcad Service',
  },
  description:
    'Cursos y diplomados especializados en redes de agua potable, alcantarillado sanitario y drenaje pluvial urbano. Campus virtual 24/7, tutores expertos y certificación.',
  keywords: [
    'ingeniería hidráulica',
    'redes de agua potable',
    'alcantarillado sanitario',
    'drenaje pluvial',
    'cursos online',
    'diplomados ingeniería',
    'WCAD',
    'formación online',
  ],
  openGraph: {
    title: 'Wcad Service - Formación En Ingeniería',
    description:
      'Cursos especializados en redes hidráulicas y sanitarias. Campus virtual, tutores expertos y certificados digitales.',
    type: 'website',
    locale: 'es_LA',
    siteName: 'Wcad Service',
  },
};

import { ScrollHelper } from '@/components/scroll-helper';
import { UserProvider } from '@/components/user-context';
import { CartProvider } from '@/context/cart-context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ScrollHelper />
        <UserProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
