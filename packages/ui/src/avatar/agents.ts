import {
  ChartLineIcon,
  MagnifyingGlassIcon,
  PenNibIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

/**
 * The agents, by name and by mark.
 *
 * An activity feed that says "an article was published" describes weather. The product's
 * whole promise is that something is working for you, so the actor is named and is the
 * SUBJECT of the sentence: `ZeroCorp Writer published "…"`, never the passive.
 *
 * Each agent carries a mark as well as a name, for the same reason every status carries a
 * glyph (§14): a name in a dense feed is scanned, not read, and a shape is found faster
 * than a word.
 *
 * All five wear the `ai` tone. Agent output borrowing `--processing` would make "an agent
 * is working" and "ZeroCorp" the same colour, which §4.5 added `--ai` specifically to stop.
 */
export const AGENTS = {
  writer: { name: "ZeroCorp Writer", mark: PenNibIcon, does: "Writes and publishes content" },
  prospector: { name: "ZeroCorp Prospector", mark: MagnifyingGlassIcon, does: "Finds and qualifies leads" },
  community: { name: "ZeroCorp Community", mark: UsersThreeIcon, does: "Replies and posts socially" },
  analyst: { name: "ZeroCorp Analyst", mark: ChartLineIcon, does: "Reads the numbers and reports" },
  assistant: { name: "ZeroCorp Assistant", mark: SparkleIcon, does: "Handles everything else" },
} as const;

export type AgentKey = keyof typeof AGENTS;

/** Initials for an agent mark used where a person's initials would go. */
export const agentInitials = (key: AgentKey): string => AGENTS[key].name.slice(9, 11).toUpperCase();

/**
 * Initials from a person's name. Two letters, never one.
 *
 * "Olivier" alone gives "O", which in a stack of six is not an identity. A single-word
 * name takes its first two letters instead.
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
