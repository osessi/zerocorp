import { PageHeader } from "@zerocorp/ui";
import { Panel } from "../ui";

export const metadata = { title: "Help · ZeroCorp" };

export default function Page() {
  return (
    <>
      <PageHeader title="Help" subtitle="What ZeroCorp is doing, and how to reach a person" />
      <div className="flex max-w-2xl flex-col gap-10 px-5 py-8 sm:px-8">
        <Panel title="How this works">
          <div className="border-border flex flex-col gap-4 border p-5">
            <p className="text-body-sm text-pretty">
              You answered a handful of questions and approved a plan. ZeroCorp works
              through that plan and shows you where it has got to on the Overview. Anything
              that needs you appears there before it appears anywhere else.
            </p>
            <p className="text-body-sm text-muted-foreground text-pretty">
              Nothing is filed, published or sent without your approval. Where a step is
              done by a person rather than automatically, the page that owns it says so.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
