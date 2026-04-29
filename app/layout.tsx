import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* ============================================================
   eFTBL · Root Layout
   ------------------------------------------------------------
   Loads Archivo (display + body) and JetBrains Mono (labels,
   scores, timestamps, status). Both via next/font/google so
   they're self-hosted and don't FOUC.

   The CSS variables --font-archivo and --font-mono are
   referenced by globals.css and tailwind.config.ts.
   ============================================================ */

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "eFTBL — eFootball tournaments, played for real",
  description:
    "48-player FIFA WC format. Group draws, knockouts, real stakes. Run by your community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
