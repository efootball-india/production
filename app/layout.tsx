// PASS-9-LAYOUT (editorial theme + restored chrome)
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import NavigationProgress from '../components/NavigationProgress';
import AppHeader from '../components/AppHeader';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'eFTBL · eFootball Tournament Platform',
  description: 'A community tournament platform for eFootball 1v1 players. Group stages, knockouts, rankings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
