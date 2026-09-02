import type { ComponentType } from "react";
import { cx } from "../cx";
import type { StatusTone } from "../tone";

/**
 * Avatar — initials, a mark, or an image, optionally carrying the tone of its row.
 *
 * Promoted from the dashboard prototype 2026-09-02. §4.5 recorded the reason before the
 * component existed: "the reference is full of avatar photographs. Faces bring colour that
 * tokens cannot." A product with no faces reads flat no matter how good the palette is,
 * and no token fixes it.
 *
 * Given a tone, the avatar repeats what the row's badge says, so the row reads as one
 * object rather than a grey chip beside a coloured one. It stays a REPEAT and never the
 * only carrier: the badge keeps its label and its glyph (§14).
 */
const AVATAR_TONE: Record<StatusTone, string> = {
  success: "bg-success-subtle text-success-ink",
  warning: "bg-warning-subtle text-warning-ink",
  danger: "bg-destructive-subtle text-destructive-ink",
  info: "bg-info-subtle text-info-ink",
  processing: "bg-processing-subtle text-processing-ink",
  neutral: "bg-secondary text-secondary-foreground",
  ai: "bg-ai-subtle text-ai-ink",
};

/** §7: an avatar is a control-sized object, so it takes the 4px tier, never a circle. */
const AVATAR_SIZE = {
  sm: { box: "size-6", text: "text-caption", icon: 12 },
  md: { box: "size-8", text: "text-caption", icon: 16 },
  lg: { box: "size-12", text: "text-h4", icon: 24 },
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZE;

export function Avatar({
  initials,
  mark: Mark,
  src,
  name,
  size = "md",
  tone,
  className,
}: {
  initials?: string;
  /** A Phosphor icon, for an agent rather than a person. */
  mark?: ComponentType<{ size?: number; className?: string }>;
  src?: string;
  /** The accessible name. Without it the avatar is decorative and hidden. */
  name?: string;
  size?: AvatarSize;
  tone?: StatusTone;
  className?: string;
}) {
  const dim = AVATAR_SIZE[size];
  const label = name ? { role: "img", "aria-label": name } : { "aria-hidden": true as const };

  return (
    <span
      {...label}
      className={cx(
        dim.box,
        "rounded-sm inline-flex shrink-0 items-center justify-center overflow-hidden font-medium",
        tone ? AVATAR_TONE[tone] : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {/* An image wins when there is one. Initials and marks are the fallback, which is
          the normal case today and will stay the normal case for agents forever. */}
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : Mark ? (
        <Mark size={dim.icon} />
      ) : (
        <span className={dim.text}>{initials ?? "??"}</span>
      )}
    </span>
  );
}
