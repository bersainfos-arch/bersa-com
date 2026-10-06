import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { MOBILE_MONEY } from "@/lib/catalog";
import logo from "@/assets/bersa-logo.png.asset.json";

export const Route = createFileRoute("/facture/$id")({
  head: () => ({
    meta: [
      { title: "Facture — BERSA" },
      { name: "description", content: "Facture imprimable de votre commande BERSA." },
      { property: "og:title", content: "Facture — BERSA" },
      { property: "og:description", content: "Facture de commande BERSA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <AuthGate><Invoice /></AuthGate>,
});

type Order = {
  id: string; item: string; kind: string; modality: string | null; created_at: string; full_name: string; phone: string;
  email: string | null; price_usd: number | null; paid: boolean; payment_method: string | null; payment_ref: string | null;
};

function Invoice() {
  const { id } = Route.useParams();
  const [o, setO] = useState<Order | null | undefined>(undefined);
  useEffect(() => {
    supabase.from("orders").select("id,item,kind,modality,created_at,full_name,phone,email,price_usd,paid,payment_method,payment_ref")
      .eq("id", id).maybeSingle().then(({ data }) => setO((data as Order) ?? null));
  }, [id]);
  if (o === undefined) return <p className="p-10 text-center text-muted-foreground">Chargement…</p>;
  if (o === null) return <p className="p-10 text-center text-muted-foreground">Facture introuvable.</p>;
  const num = `BERSA-${o.created_at.slice(0, 10).replace(/-/g, "")}-${o.id.slice(0, 6).toUpperCase()}`;
  return (
    <div className="min-h-screen bg-muted px-4 py-8 print:bg-card print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl justify-between print:hidden">
        <Button variant="outline" asChild><Link to="/profil"><ArrowLeft className="mr-1 h-4 w-4" />Retour</Link></Button>
        <Button onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Imprimer / PDF</Button>
      </div>
      <div className="mx-auto max-w-2xl rounded-2xl bg-card p-8 shadow-soft print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <img src={logo.url} alt="Logo BERSA" className="h-16 w-16 rounded-xl" />
            <div>
              <div className="font-display text-3xl font-bold">BERSA</div>
              <div className="text-xs text-muted-foreground">Berceau du Savoir</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-display text-2xl font-bold">Facture</div>
            <div>N° {num}</div>
            <div>{new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>
        <div className="mt-6 text-sm">
          <div className="text-xs uppercase text-muted-foreground">Client</div>
          <div className="font-semibold">{o.full_name}</div>
          <div>{o.phone}</div>
          {o.email && <div>{o.email}</div>}
        </div>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Désignation</th><th className="py-2 text-right">Prix</th></tr></thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">{o.item}<div className="text-xs text-muted-foreground">{o.kind}{o.modality ? ` · ${o.modality}` : ""}</div></td>
              <td className="py-3 text-right">{o.price_usd ? `${o.price_usd} $` : "Sur devis"}</td>
            </tr>
          </tbody>
          <tfoot><tr><td className="py-3 font-bold">Total</td><td className="py-3 text-right font-display text-2xl font-bold text-primary">{o.price_usd ? `${o.price_usd} $` : "Sur devis"}</td></tr></tfoot>
        </table>
        <div className="mt-4 text-sm">
          État du paiement : <b>{o.paid ? "Payé" : "En vérification"}</b>
          {o.payment_ref && <> · {o.payment_method} · Réf. {o.payment_ref}</>}
        </div>
        <div className="mt-6 rounded-xl border border-gold p-4 text-sm">
          <div className="font-semibold">Paiement Mobile Money</div>
          <div>M-Pesa : {MOBILE_MONEY.mpesa}</div>
          <div>Airtel Money : {MOBILE_MONEY.airtel}</div>
        </div>
        <p className="mt-8 text-center font-display italic text-muted-foreground">« Notre devoir est d'acquérir le savoir »</p>
      </div>
    </div>
  );
}
