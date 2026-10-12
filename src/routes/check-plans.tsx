import { createFileRoute } from "@tanstack/react-router";
import { PlanQuickList } from "@/components/PlanQuickList";
import { QuotaMeter } from "@/components/QuotaMeter";

export const Route = createFileRoute("/check-plans")({
  component: () => (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <QuotaMeter quota={{ used: 17, limit: 20 }} />
      <QuotaMeter quota={{ used: 20, limit: 20 }} />
      <PlanQuickList />
    </div>
  ),
});
