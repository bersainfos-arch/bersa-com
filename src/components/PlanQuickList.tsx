import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Plan = {
  id: string;
  plan_code: string;
  plan_name: string;
  duration_months: number;
  price: number;
  currency: string;
  daily_conversation_limit: number;
};

const ORDER = ["free", "standard", "premium", "pro", "ultra"];

/** Compact list of the active subscription plans: name, daily conversation limit and prices per duration. */
export function PlanQuickList({ showFree = false }: { showFree?: boolean }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("duration_months")
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  if (!plans || plans.length === 0) return null;

  const codes = ORDER.filter((c) => plans.some((p) => p.plan_code === c) && (showFree || c !== "free"));
  if (codes.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Formules disponibles — prix en dollars américains (USD)
      </p>
      <ul className="mt-2 space-y-2">
        {codes.map((code) => {
          const rows = plans
            .filter((p) => p.plan_code === code)
            .sort((a, b) => a.duration_months - b.duration_months);
          const name = rows[0]?.plan_name ?? code;
          const limit = rows[0]?.daily_conversation_limit;
          return (
            <li key={code} className="rounded-xl border bg-card/70 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-semibold">{name}</span>
                {limit != null && (
                  <span className="text-xs text-muted-foreground">
                    {limit} conversation{limit > 1 ? "s" : ""} / jour
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {rows.map((r) => (
                  <span key={r.id} className="rounded-md border bg-background px-2 py-0.5 text-xs">
                    {r.duration_months > 0 ? `${r.duration_months} mois` : "Sans durée"} ·{" "}
                    {Number(r.price)} {r.currency}
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <Link to="/abonnements" className="mt-2 inline-block text-xs font-semibold underline">
        Comparer toutes les formules
      </Link>
    </div>
  );
}
