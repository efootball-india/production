// PASS-10-LAYOUT (editorial theme + OG metadata + favicon)
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
  metadataBase: new URL('https://eftbl.in'),
  title: {
    default: 'eFTBL · Where every match counts',
    template: '%s · eFTBL',
  },
  description: 'You take this seriously. So do we. Real tournaments, verified scores, a season-long ranking that remembers every match you play.',
  keywords: ['eFootball', 'tournaments', 'esports', '1v1', 'gaming community', 'eFTBL', 'India eFootball', 'eFootball league'],
  authors: [{ name: 'eFTBL' }],
  creator: 'eFTBL',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eftbl.in',
    siteName: 'eFTBL',
    title: 'eFTBL · Where every match counts',
    description: 'You take this seriously. So do we. Real tournaments, verified scores, a season-long ranking that remembers every match you play.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'eFTBL — eFootball tournament platform. Where every match counts.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eFTBL · Where every match counts',
    description: 'Real tournaments, verified scores, a season-long ranking. eFootball played seriously.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#0a0a0a',
  robots: {
    index: true,
    follow: true,
  },
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
