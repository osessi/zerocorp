"use client";

import { useEffect, useState } from "react";
import { DeviceMobileIcon, DesktopIcon, DeviceTabletIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonGroupControls } from "./Controls";
import { Gallery } from "./Gallery";
import { Walkthrough } from "./Walkthrough";

/**
 * The conversational assessment, before it replaces anything.
 *
 * Two modes, because they answer different questions. The walkthrough runs the REAL
 * deterministic interviewer and architect, so it shows what the experience does rather
 * than what someone hoped it would do. The gallery shows every state at once, because
 * reviewing a state by walking to it takes five answers and a memory of the last one.
 *
 * Nothing here writes to the database and nothing calls a model. It is safe to reload,
 * safe to break, and it costs nothing to look at.
 */

type Mode = "walkthrough" | "gallery";
type Width = "full" | "tablet" | "mobile";

/**
 * Device frame sizes.
 *
 * Passed as inline style rather than Tailwind brackets on purpose, and the token guard
 * in tests/architecture is right to have caught the first attempt. These are not
 * product values: they are the dimensions of a simulated device, which is data about
 * the thing being previewed. Keeping width and height together in one table is also
 * how they stay obviously paired.
 */
const FRAMES: Record<Width, { width: string; height: string }> = {
  full: { width: "100%", height: "auto" },
  tablet: { width: "834px", height: "820px" },
  mobile: { width: "390px", height: "820px" },
};

export default function Page() {
  const [mode, setMode] = useState<Mode>("walkthrough");
  const [dark, setDark] = useState(false);
  const [width, setWidth] = useState<Width>("full");

  // The theme class goes on the root element: a portal escapes any wrapper, so setting
  // it on a container would leave overlays in the other theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  const framed = width !== "full";

  return (
    <div className="bg-muted min-h-dvh">
      <div className="border-border bg-background sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b px-6 py-3">
        <span className="text-label">Assessment preview</span>

        <ButtonGroupControls
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { value: "walkthrough", label: "Walkthrough" },
            { value: "gallery", label: "Every state" },
          ]}
        />

        <ButtonGroupControls
          value={width}
          onChange={(v) => setWidth(v as Width)}
          options={[
            { value: "full", label: "Full", icon: DesktopIcon },
            { value: "tablet", label: "Tablet", icon: DeviceTabletIcon },
            { value: "mobile", label: "Mobile", icon: DeviceMobileIcon },
          ]}
        />

        <ButtonGroupControls
          value={dark ? "dark" : "light"}
          onChange={(v) => setDark(v === "dark")}
          options={[
            { value: "light", label: "Light", icon: SunIcon },
            { value: "dark", label: "Dark", icon: MoonIcon },
          ]}
        />

        <span className="text-caption text-muted-foreground ml-auto hidden lg:inline">
          Real interviewer, real schemas, no model call and no database
        </span>
      </div>

      <div className={framed ? "flex justify-center p-6" : ""}>
        <div
          style={framed ? FRAMES[width] : undefined}
          className={framed ? "border-border bg-background overflow-hidden border" : "bg-background"}
        >
          <div className={framed ? "h-full overflow-y-auto" : ""}>
            {mode === "walkthrough" ? <Walkthrough /> : <Gallery />}
          </div>
        </div>
      </div>
    </div>
  );
}
