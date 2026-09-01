"use client";

import type { ComponentType } from "react";
import { cx } from "@zerocorp/ui";

/**
 * Review-only controls. Not a product component and deliberately not promoted: a
 * segmented control is a design decision nobody has made, and the preview must not be
 * the place a new pattern quietly enters the system.
 */
export function ButtonGroupControls({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: ComponentType<{ size?: number }> }>;
}) {
  return (
    <div className="border-input flex border">
      {options.map((option, i) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cx(
              "text-body-sm flex h-8 items-center gap-2 px-3",
              "transition-[color,background-color,border-color] duration-normal ease-out",
              "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
              i > 0 && "border-input border-l",
              active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon size={16} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
