import { Shell } from "../../(product)/Shell";
import VisualArchitecturePage from "../visual-architecture/page";

export const metadata = { title: "Shell · ZeroCorp" };

/**
 * The real product frame, with sample props.
 *
 * `Shell` is a client component taking plain props, so it renders without a database or
 * a session. That makes the rail, the top bar and the command menu reviewable here,
 * which the product routes are not: they call `getViewer()` and redirect to /signin.
 *
 * Sample data. Nothing here reads a repository.
 */
export default function ShellPreviewPage() {
  return (
    <Shell
      email="founder@northwind.co"
      needsYou={2}
      counts={{
        "/company": 3,
        "/website": 5,
        "/email": 2,
        "/content": 12,
        "/leads": 148,
      }}
      attention={{ "/company": true }}
      announcement={{
        message: "Your Delaware filing needs your signature before it can be submitted.",
        href: "/company",
        action: "Sign now",
      }}
    >
      <VisualArchitecturePage />
    </Shell>
  );
}
