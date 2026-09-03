import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getViewer } from "../../server/session";
import { getDashboardRepository, getUnitOfWork } from "../../server/container";
import { Shell } from "./Shell";

/**
 * Everything under (product) is signed in.
 *
 * The guard is here rather than in each page: a route group whose authentication depends
 * on every page remembering to check is a route group with a hole in it, and the hole is
 * always the page someone added last.
 */
export default async function ProductLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const overview = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getDashboardRepository().overview(tx, viewer.ctx),
  );

  // The badge on Overview is the count of steps waiting on the founder. It belongs in
  // the rail because it is the one number that should reach them without opening a page.
  const st = overview?.state;
  const needsYou =
    (overview?.steps.filter((s) => s.included && s.status === "blocked").length ?? 0) + (st?.openRfi ? 1 : 0);

  // The overview is already fetched for the badge, so the counts are free.
  const counts: Record<string, number> = st
    ? {
        "/content": st.postsPublished + st.postsScheduled + st.postsDraft,
        "/leads": st.leadsTotal,
        "/email": st.mailboxes,
        "/website": st.pages,
        "/company": st.openRfi ? 1 : 0,
      }
    : {};

  return (
    <Shell
      email={viewer.email}
      needsYou={needsYou}
      counts={counts}
      announcement={
        st?.openRfi
          ? { message: st.openRfi, href: "/company#filing", action: "Send your passport page" }
          : null
      }
    >
      {children}
    </Shell>
  );
}
