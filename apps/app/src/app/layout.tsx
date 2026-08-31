import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

/**
 * Root layout for the authenticated product: back-office and admin console.
 *
 * Geist Sans and Geist Mono are loaded here and exposed as the CSS variables the token
 * layer reads (--font-geist-sans, --font-geist-mono). docs/DESIGN_SYSTEM.md §5.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
