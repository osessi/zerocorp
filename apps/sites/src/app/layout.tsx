import type { ReactNode } from "react";

/**
 * Root layout for every tenant website. Theme, fonts and tokens resolve per
 * tenant from @zerocorp/site-renderer once the design system is locked
 * (docs/OPEN_DECISIONS.md D-G6).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
