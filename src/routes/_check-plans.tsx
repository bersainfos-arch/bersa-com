import { createFileRoute } from "@tanstack/react-router";
import { PlanQuickList } from "@/components/PlanQuickList";

export const Route = createFileRoute("/_check-plans")({
  component: () => (
    <div className="mx-auto max-w-4xl p-6">
      <PlanQuickList />
    </div>
  ),
});
