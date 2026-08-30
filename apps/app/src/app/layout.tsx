import type { ReactNode } from "react";

/** Root layout for the authenticated product: back-office and admin console. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
