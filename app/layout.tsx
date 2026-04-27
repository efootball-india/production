import type { Metadata } from 'next';

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
      <body style={{ margin: 0, padding: 0, background: '#050a08' }}>
        {children}
      </body>
    </html>
  );
}
