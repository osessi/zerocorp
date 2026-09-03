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

  /**
   * Which sections have something waiting on the FOUNDER.
   *
   * The dot was on Overview and Company and nowhere else, so five sections with real
   * work in them looked identical to five with none. It means one thing everywhere now:
   * a person has to act here.
   *
   * Warm-up is deliberately absent. It takes four weeks and requires nothing from
   * anybody, and marking it would teach the dot to mean "something is happening", which
   * is what the count already says.
   */
  const attention: Record<string, boolean> = st
    ? {
        "/company": !!st.openRfi,
        "/content": st.postsDraft > 0,
        "/website": st.pages - st.pagesPublished > 0,
        "/leads": st.leadsNoBasis > 0,
      }
    : {};

  return (
    <Shell
      email={viewer.email}
      needsYou={needsYou}
      counts={counts}
      attention={attention}
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
