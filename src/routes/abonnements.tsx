import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PaymentCurrency } from "@/components/PaymentCurrency";

export const Route = createFileRoute("/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements — BERSA" },
      { name: "description", content: "Formules Gratuit, Standard, Premium, Pro et Ultra Pro de BERSA : prix en USD, durées et fonctionnalités." },
      { property: "og:title", content: "Abonnements — BERSA" },
      { property: "og:description", content: "Comparez les cinq formules BERSA et choisissez la vôtre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }, { property: "og:image", content: "/icon-512.png" }, { property: "og:url", content: "https://bersa.org/abonnements" },
    ],
  }),
  component: Page,
});

type Plan = { id: string; plan_code: string; plan_name: string; duration_months: number; price: number; currency: string; daily_conversation_limit: number; features: string[] };
const ORDER = ["free", "standard", "premium", "pro", "ultra"];

function Page() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dur, setDur] = useState<Record<string, number>>({});
  const [choice, setChoice] = useState<Plan | null>(null);
  const [compare, setCompare] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [reqKey, setReqKey] = useState(0);

  useEffect(() => {
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("duration_months").then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("quota_period", today);
      const { data } = await supabase.rpc("current_daily_limit", { _user: user.id });
      setQuota({ used: count ?? 0, limit: Number(data ?? 20) });
    })();
  }, [user]);

  const codes = ORDER.filter((c) => plans.some((p) => p.plan_code === c));
  const pick = (code: string) => {
    const list = plans.filter((p) => p.plan_code === code);
    return list.find((p) => p.duration_months === (dur[code] ?? list[0]?.duration_months)) ?? list[0];
  };

  return (
    <AppShell>
       <div className="mx-auto max-w-6xl space-y-4 px-3 py-4"><h1 className="text-3xl">Abonnements</h1><p className="text-xs text-muted-foreground">Prix de référence en USD · Activation après validation du paiement</p>
        {quota && (
          <div className="rounded-xl border bg-card p-4">
            <div className="flex justify-between text-sm"><span>Conversations aujourd'hui</span><span>{quota.used} / {quota.limit} — reste {Math.max(0, quota.limit - quota.used)}</span></div>
            <QuotaBar used={quota.used} limit={quota.limit} />
            <p className="mt-1 text-xs text-muted-foreground">Renouvellement chaque jour à minuit (UTC).</p>
          </div>
        )}
         <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {codes.map((code) => {
             const p = pick(code); if (!p) return null;
            const durations = plans.filter((x) => x.plan_code === code);
            const rec = code === "premium";
            return (
               <div key={code} className={`flex min-w-0 flex-col rounded-lg border bg-card p-3 ${rec ? "border-gold ring-1 ring-gold" : ""}`}>
                {rec && <span className="mb-2 w-fit rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-gold-foreground">Recommandée</span>}
                 <h3 className="text-xl font-bold">{p.plan_name}</h3>
                 <div className="mt-1 font-display text-3xl font-bold text-primary">{Number(p.price)} $</div>
                <div className="text-xs text-muted-foreground">{code === "free" ? "Sans durée" : `${p.duration_months} mois · ${p.currency}`}</div>
                {durations.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {durations.map((d) => (
                       <Button size="sm" variant={d.duration_months === p.duration_months ? "default" : "outline"} key={d.id} onClick={() => setDur({ ...dur, [code]: d.duration_months })}
                         className="h-6 px-1 text-[10px]">
                        {d.duration_months} m
                       </Button>
                    ))}
                  </div>
                )}
                 <ul className="mt-2 flex-1 space-y-1 text-xs">
                  {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                  <li className="text-muted-foreground">Quota : {p.daily_conversation_limit} conversations / jour</li>
                </ul>
                 {code !== "free" && <Button size="sm" className="mt-3" onClick={() => setChoice(p)}>Choisir</Button>}
                <Button variant="ghost" size="sm" className="mt-1" onClick={() => setCompare(true)}>Comparer les formules</Button>
              </div>
            );
          })}
        </div>

        {compare && (
          <div className="overflow-x-auto rounded-xl border bg-card p-4">
            <div className="mb-2 flex justify-between"><h3 className="text-xl font-bold">Comparaison</h3><button onClick={() => setCompare(false)} className="text-sm underline">Fermer</button></div>
            <table className="w-full text-sm">
              <thead><tr className="text-left"><th className="p-2">Durée</th>{codes.filter((c) => c !== "free").map((c) => <th key={c} className="p-2">{pick(c)?.plan_name}</th>)}</tr></thead>
              <tbody>
                {[1, 2, 3, 6, 12].map((m) => (
                  <tr key={m} className="border-t"><td className="p-2">{m} mois</td>
                    {codes.filter((c) => c !== "free").map((c) => <td key={c} className="p-2">{plans.find((p) => p.plan_code === c && p.duration_months === m)?.price ?? "—"} $</td>)}
                  </tr>
                ))}
                <tr className="border-t"><td className="p-2">Quota / jour</td>{codes.filter((c) => c !== "free").map((c) => <td key={c} className="p-2">{pick(c)?.daily_conversation_limit}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )}

        {user && <MyRequests key={reqKey} />}

        {choice && <Checkout plan={choice} onClose={() => { setChoice(null); setReqKey((k) => k + 1); }} />}
      </div>
    </AppShell>
  );
}

export function QuotaBar({ used, limit }: { used: number; limit: number }) {
  const left = limit ? Math.max(0, (limit - used) / limit) : 0;
  const color = left > 0.5 ? "bg-emerald-500" : left > 0.2 ? "bg-amber-500" : "bg-destructive";
  return <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full ${color}`} style={{ width: `${left * 100}%` }} /></div>;
}

function Checkout({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [paymentCurrency,setPaymentCurrency]=useState("USD");const [paymentAmount,setPaymentAmount]=useState<number|null>(plan.price);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
     if (!user) return;
    const f = new FormData(e.currentTarget);
    if(paymentAmount===null){toast.error("Taux de paiement indisponible.");return;}
    setBusy(true);
    const { error } = await supabase.from("subscriptions").insert({
      plan_code: plan.plan_code, duration_months: plan.duration_months, amount: plan.price, currency: plan.currency,
       user_id: user.id, status: "pending", started_at: null, expires_at: null,
      payment_provider: String(f.get("method")), payment_reference: String(f.get("ref")).trim().slice(0, 80),
      payment_currency:paymentCurrency,payment_amount:paymentAmount,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Demande enregistrée. Votre abonnement sera activé après vérification du paiement.");
    onClose();
    return undefined;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-card p-6">
        <h3 className="text-2xl font-bold">{plan.plan_name} — {plan.duration_months} mois</h3>
        <p className="text-3xl font-bold text-primary">{Number(plan.price)} $ USD</p>
        <PaymentCurrency usd={plan.price} onChange={(currency,amount)=>{setPaymentCurrency(currency);setPaymentAmount(amount);}}/>
        {!["USD","CDF"].includes(paymentCurrency)&&<p className="text-sm">Contactez bersainfos@gmail.com pour les coordonnées de paiement dans cette devise.</p>}
        <p className="rounded-md bg-muted p-3 text-sm">Le paiement automatique n'est pas encore disponible. Envoyez le montant par Mobile Money puis indiquez la référence de la transaction. L'abonnement est activé uniquement après vérification par l'équipe BERSA.</p>
        <ul className="rounded-md border p-3 text-sm"><li>M-Pesa : <strong>0818147637</strong></li><li>Airtel Money : <strong>0971395319</strong></li></ul>
        <select name="method" className="w-full rounded-md border bg-background p-2" required>
          <option value="mpesa">M-Pesa</option>
          <option value="airtel">Airtel Money</option>
        </select>
        <Input name="ref" placeholder="Référence de la transaction" required maxLength={80} />
        <div className="flex gap-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button><Button className="flex-1" disabled={busy}>Envoyer</Button></div>
      </form>
    </div>
  );
}

type Req = { id: string; plan_code: string; duration_months: number; amount: number; currency: string; status: string; payment_provider: string | null; payment_reference: string | null; created_at: string; expires_at: string | null };
const STATUS: Record<string, string> = { pending: "En attente de vérification", active: "Actif", rejected: "Refusé", expired: "Expiré" };

function MyRequests() {
  const [rows, setRows] = useState<Req[]>([]);
  useEffect(() => {
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => setRows((data as Req[]) ?? []));
  }, []);
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-xl font-bold">Mes demandes d'abonnement</h3>
      <ul className="divide-y text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="capitalize">{r.plan_code} — {r.duration_months} mois · {Number(r.amount)} $ {r.currency}</span>
            <span className="text-muted-foreground">{r.payment_provider === "airtel" ? "Airtel Money" : "M-Pesa"} · réf. {r.payment_reference}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{STATUS[r.status] ?? r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
