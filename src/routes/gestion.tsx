import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Phone } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { STATUSES, StatusBadge } from "@/components/StatusBadge";
import { waLink } from "@/lib/catalog";
import { BookManager } from "@/components/BookManager";

export const Route = createFileRoute("/gestion")({
  head: () => ({
    meta: [
      { title: "Espace gestionnaire — BERSA" },
      { name: "description", content: "Console de traitement des commandes et inscriptions BERSA." },
      { property: "og:title", content: "Espace gestionnaire — BERSA" },
      { property: "og:description", content: "Traitement des demandes reçues." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Order = {
  id: string; item: string; kind: string; modality: string | null; status: string; created_at: string;
  full_name: string; phone: string; email: string | null; details: string | null; attachment_link: string | null; price_usd: number | null;
  payment_method: string | null; payment_ref: string | null; paid: boolean;
};

function Page() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      if (data) supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders((data as Order[]) ?? []));
    });
  }, [user]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
    return undefined;
  }

  async function togglePaid(id: string, paid: boolean) {
    const { error } = await supabase.from("orders").update({ paid }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, paid } : x)));
  }

  const list = filter === "all" ? orders : orders.filter((o) => o.kind === filter);

  return (
    <AppShell>
      <PageHeader title={t("admin")} subtitle="Espace Passeur" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading ? null : !user ? (
          <div className="text-center"><Button asChild><Link to="/profil">{t("signIn")}</Link></Button></div>
        ) : isAdmin === false ? (
          <p className="text-center text-muted-foreground">Accès réservé aux gestionnaires BERSA.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {([["all", "Tout"], ["redaction", "Rédaction"], ["formation", "Formations"], ["livre", "Livres"]] as const).map(([v, l]) => (
                <Button key={v} size="sm" variant={filter === v ? "default" : "outline"} onClick={() => setFilter(v)}>{l}</Button>
              ))}
              <span className="ml-auto self-center text-sm text-muted-foreground">{list.length} demande(s)</span>
            </div>
            <BookManager />
            <h2 className="mt-10 text-2xl font-bold">Demandes reçues</h2>
            <div className="mt-4 space-y-3">
              {list.map((o) => (
                <div key={o.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{o.item}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.kind}{o.modality ? ` · ${o.modality}` : ""}{o.price_usd ? ` · ${o.price_usd} $` : ""} · {new Date(o.created_at).toLocaleString()}
                      </div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-2 text-sm"><b>{o.full_name}</b> · {o.phone}{o.email ? ` · ${o.email}` : ""}</div>
                  {o.price_usd ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span>{o.payment_method ?? "—"} · Réf. <b>{o.payment_ref ?? "—"}</b></span>
                      <Button size="sm" variant={o.paid ? "default" : "outline"} onClick={() => togglePaid(o.id, !o.paid)}>
                        {o.paid ? "Paiement confirmé ✓" : "Confirmer le paiement"}
                      </Button>
                    </div>
                  ) : null}
                  {o.details && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{o.details}</p>}
                  {o.attachment_link && /^https?:\/\//.test(o.attachment_link) && (
                    <a href={o.attachment_link} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Fichiers joints</a>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <Button key={s.v} size="sm" variant={o.status === s.v ? "default" : "outline"} onClick={() => setStatus(o.id, s.v)}>{s.label}</Button>
                    ))}
                    <Button asChild size="sm" className="bg-success text-primary-foreground hover:bg-success/90">
                      <a href={waLink(o.phone, `Bonjour ${o.full_name}, BERSA concernant : ${o.item}`)} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-4 w-4" />WhatsApp</a>
                    </Button>
                    <Button asChild size="sm" variant="outline"><Link to="/facture/$id" params={{ id: o.id }}>Facture</Link></Button>
                    <Button asChild size="sm" variant="outline"><a href={`tel:${o.phone}`}><Phone className="h-4 w-4" /></a></Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
