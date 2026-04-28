import type { Metadata } from 'next';
import { Suspense } from 'react';
import NavigationProgress from '../components/NavigationProgress';
import './globals.css';

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
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
