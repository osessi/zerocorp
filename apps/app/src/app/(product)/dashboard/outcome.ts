import type { BusinessState } from "@zerocorp/application";

/**
 * What a finished step actually produced.
 *
 * A done row used to be a title and a check. "Start publishing on a schedule ✓" tells a
 * founder nothing — they know they asked for it, what they want to know is whether it
 * worked. "12 published, 3 scheduled" is the same row carrying the answer.
 *
 * Keyed by category rather than by step key, because the plan is generated and its keys
 * are not a closed list, while the nine categories are.
 */
export function outcomeFor(category: string, state: BusinessState): string | null {
  switch (category) {
    case "content":
      if (state.postsPublished + state.postsScheduled + state.postsDraft === 0) return null;
      return `${state.postsPublished} published · ${state.postsScheduled} scheduled · ${state.postsDraft} drafts`;
    case "seo":
      return state.keywords > 0 ? `${state.keywords} keywords tracked` : null;
    case "leads":
      return state.leadsTotal > 0
        ? `${state.leadsTotal} found · ${state.leadsQualified} qualified · ${state.leadsReplied} replied`
        : null;
    case "email":
      if (state.mailboxes === 0) return null;
      return state.warmupDay !== null
        ? `${state.mailboxes} mailboxes · warming, day ${state.warmupDay} of ${state.warmupTotal}`
        : `${state.mailboxes} mailboxes`;
    case "website":
      if (state.pages === 0) return null;
      return `${state.pages} pages · ${state.pagesPublished} published`;
    case "brand":
      return state.brandName ? `${state.brandName} · ${state.brandComplete} of 5 defined` : null;
    case "company":
      return state.formationStatus ? `Filing is ${state.formationStatus.replace(/_/g, " ")}` : null;
    default:
      return null;
  }
}

/**
 * What a step that is NOT done is waiting on, and for how long.
 *
 * The middle column of every row. Without it the row is a title, a description and 500px
 * of nothing before the action.
 */
export function waitingFor(status: string, category: string, state: BusinessState): string | null {
  if (status === "done") return null;
  if (status === "blocked") return state.openRfi ? "Waiting on you" : "Needs you";
  if (status === "in_progress") return "ZeroCorp is on it";
  // Not started, but the thing it depends on may already exist.
  if (category === "email" && !state.siteStatus) return "Needs a domain first";
  if (category === "content" && state.keywords === 0) return "Needs keywords first";
  return "Not started";
}
