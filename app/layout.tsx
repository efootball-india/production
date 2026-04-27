import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
