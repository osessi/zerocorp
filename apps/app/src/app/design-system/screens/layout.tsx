"use client";

import { useState, type ReactNode } from "react";
import { DashboardShell } from "../_prototype/shell";

/**
 * Wraps every prototype screen in DashboardShell so the shell is exercised on all five,
 * not reimplemented per screen. DESIGN_SYSTEM.md §21.2.
 */
export default function ScreensLayout({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <DashboardShell dark={dark} onToggleTheme={() => setDark((d) => !d)}>
      {children}
    </DashboardShell>
  );
}
