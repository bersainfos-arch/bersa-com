import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Sub = {
  id: string;
  user_id: string;
  plan_code: string;
  duration_months: number;
  amount: number;
  currency: string;
  status: string;
  payment_provider: string | null;
  payment_reference: string | null;
  created_at: string;
  started_at: string | null;
  expires_at: string | null;
};
type Profile = { id: string; first_name: string; last_name: string; email: string | null };
type Plan = { plan_code: string; plan_name: string; duration_months: number; daily_conversation_limit: number };

const LABELS: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  refused: "Refusé",
  expired: "Expiré",
  cancelled: "Annulé",
};

function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function Badge({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-500/15 text-emerald-700"
      : status === "refused"
        ? "bg-destructive/15 text-destructive"
        : status === "pending"
          ? "bg-amber-500/15 text-amber-700"
          : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{LABELS[status] ?? status}</span>;
}

/** Admin console for subscription requests: verify the payment, then activate or refuse. */
export function SubscriptionManager() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("subscription_plans").select("plan_code, plan_name, duration_months, daily_conversation_limit"),
    ]);
    const rows = (s as Sub[]) ?? [];
    setSubs(rows);
    setPlans((p as Plan[]) ?? []);
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length) {
      const { data: pr } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids);
      setProfiles(Object.fromEntries(((pr as Profile[]) ?? []).map((x) => [x.id, x])));
    }
  }

  useEffect(() => {
    if (user) void load();
  }, [user]);

  async function decide(row: Sub, next: "active" | "refused") {
    setBusy(row.id);
    const now = new Date();
    const patch =
      next === "active"
        ? { status: "active", started_at: now.toISOString(), expires_at: addMonths(now, row.duration_months).toISOString(), updated_at: now.toISOString() }
        : { status: "refused", updated_at: now.toISOString() };
    const { error } = await supabase.from("subscriptions").update(patch).eq("id", row.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubs((list) => list.map((x) => (x.id === row.id ? { ...x, ...patch } : x)));
    toast.success(next === "active" ? "Abonnement activé." : "Demande refusée.");
  }

  if (subs.length === 0) return null;

  const ordered = [...subs].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Demandes d'abonnement</h2>
        <Button size="sm" variant="ghost" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Actualiser
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Activez une formule uniquement après avoir vérifié le paiement reçu.
      </p>
      <div className="mt-4 space-y-3">
        {ordered.map((s) => {
          const plan = plans.find((p) => p.plan_code === s.plan_code && p.duration_months === s.duration_months)
            ?? plans.find((p) => p.plan_code === s.plan_code);
          const who = profiles[s.user_id];
          const name = who ? `${who.first_name} ${who.last_name}`.trim() : s.user_id.slice(0, 8);
          return (
            <div key={s.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {plan?.plan_name ?? s.plan_code} · {s.duration_months} mois
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Number(s.amount)} {s.currency} · demandé le {new Date(s.created_at).toLocaleString("fr-FR")}
                    {s.payment_provider ? ` · ${s.payment_provider}` : ""}
                  </div>
                </div>
                <Badge status={s.status} />
              </div>
              <div className="mt-2 text-sm">
                <b>{name}</b>
                {who?.email ? ` · ${who.email}` : ""}
                {s.payment_reference ? (
                  <span className="text-muted-foreground"> · Réf. de paiement <b>{s.payment_reference}</b></span>
                ) : null}
              </div>
              {plan && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Quota après activation : {plan.daily_conversation_limit} conversations / jour
                </div>
              )}
              {s.status === "active" && s.expires_at && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Actif jusqu'au {new Date(s.expires_at).toLocaleDateString("fr-FR")}
                </div>
              )}
              {s.status === "pending" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void decide(s, "active")} disabled={busy === s.id}>
                    <Check className="mr-1 h-4 w-4" /> Activer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void decide(s, "refused")} disabled={busy === s.id}>
                    <X className="mr-1 h-4 w-4" /> Refuser
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
