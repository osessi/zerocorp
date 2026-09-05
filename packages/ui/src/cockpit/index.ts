/*
  EmptyState moved to ../empty on 2026-09-04 and its contract changed.

  The old one REQUIRED an action, on the reasoning that "an empty state without an
  action is a dead end". That is right for two of the three causes and wrong for the
  third: a queue that is finished is not a dead end, and offering a remedy for it tells
  the founder something went wrong when nothing did. Midday ship three states for one
  table and their `ReviewComplete` deliberately offers nothing.
*/
export { CockpitHeader } from "./CockpitHeader";
export { SegmentedProgress } from "./SegmentedProgress";
export { StatusStamp, type Milestone } from "./StatusStamp";
export { StatusDot } from "./StatusDot";
