import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@zerocorp/ui";

/**
 * Landing. Deliberately one promise and one action.
 *
 * PRODUCT_SPEC.md §29.3 block 0: the assessment exists to qualify and to produce a
 * recommendation the visitor recognises as theirs. Everything on this page is in
 * service of starting it.
 */
export default function Page() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-6">
        <span className="text-label tracking-tight">ZeroCorp</span>
        <Link href="/design-system" className="text-body-sm text-muted-foreground hover:text-foreground">
          Design system
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <p className="text-overline text-muted-foreground">Free business assessment</p>
          <h1 className="text-h1 text-balance">
            Tell us where you are, where you want to go, and we will build the right business
            system for you.
          </h1>
          <p className="text-body text-muted-foreground max-w-prose">
            Five questions. We tell you where you stand, what is missing, and exactly what we
            would build. No account, no card, nothing to install.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <ButtonLink as={Link} href="/assessment" variant="primary" size="lg" icon={ArrowRightIcon} iconPosition="end">
              Start the assessment
            </ButtonLink>
            <span className="text-caption text-muted-foreground">Takes about three minutes.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
