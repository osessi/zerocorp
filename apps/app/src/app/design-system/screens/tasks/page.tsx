import { PageHeader } from "../../_prototype/shell";

export default function TasksScreen() {
  return (
    <>
      <PageHeader breadcrumb={<span>Tasks</span>} title="Tasks" subtitle="Not part of the five reviewed screens" />
      <div className="p-8">
        <p className="text-body-sm text-muted-foreground">
          Placeholder so the sidebar has no dead link during review.
        </p>
      </div>
    </>
  );
}
