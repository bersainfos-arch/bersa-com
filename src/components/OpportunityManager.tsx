import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, RefreshCw } from "lucide-react";

type Opp = {
  id: string;
  organisation: string;
  contact_email: string;
  title: string;
  kind: string;
  domain: string;
  location: string | null;
  deadline: string | null;
  description: string;
  status: string;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  emploi: "Emploi",
  stage: "Stage",
  bourse: "Bourse",
  appel: "Appel d'offres",
  autre: "Autre",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  active: "Publiée",
  refused: "Refusée",
};

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export function OpportunityManager() {
  const [rows, setRows] = useState<Opp[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: apps }] = await Promise.all([
      supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("opportunity_id"),
    ]);
    if (error) {
      toast.error("Chargement impossible", { description: error.message });
    } else {
      const list = (data ?? []) as Opp[];
      setRows(list);
      const map: Record<string, number> = {};
      for (const a of (apps ?? []) as { opportunity_id: string }[]) {
        map[a.opportunity_id] = (map[a.opportunity_id] ?? 0) + 1;
      }
      setCounts(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(row: Opp, next: "active" | "refused") {
    setBusyId(row.id);
    const { error } = await supabase.from("opportunities").update({ status: next }).eq("id", row.id);
    setBusyId(null);
    if (error) {
      toast.error("Mise à jour impossible", { description: error.message });
      return;
    }
    toast.success(next === "active" ? "Opportunité publiée" : "Opportunité refusée");
    void load();
  }

  const pending = rows.filter((r) => r.status === "pending");
  const others = rows.filter((r) => r.status !== "pending");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-gold" /> Opportunités reçues
          {pending.length > 0 && (
            <Badge className="bg-amber text-amber-foreground">{pending.length} en attente</Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Actualiser
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune opportunité publiée ou demandée.</p>
        ) : (
          [...pending, ...others].map((r) => (
            <div key={r.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.organisation} · {KIND_LABEL[r.kind] ?? r.kind} · {r.domain}
                    {r.location ? ` · ${r.location}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Contact : {r.contact_email} · reçue le {fmtDate(r.created_at)}
                    {r.deadline ? ` · limite ${fmtDate(r.deadline)}` : ""}
                    {counts[r.id] ? ` · ${counts[r.id]} candidature(s)` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      r.status === "active"
                        ? "border-emerald text-emerald"
                        : r.status === "refused"
                          ? "border-red text-red"
                          : "border-amber text-amber"
                    }
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                  {r.status === "pending" ? (
                    <>
                      <Button size="sm" disabled={busyId === r.id} onClick={() => void decide(r, "active")}>
                        Publier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === r.id}
                        onClick={() => void decide(r, "refused")}
                      >
                        Refuser
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.id}
                      onClick={() => void decide(r, r.status === "active" ? "refused" : "active")}
                    >
                      {r.status === "active" ? "Retirer" : "Publier"}
                    </Button>
                  )}
                </div>
              </div>
              {r.description && (
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                  {r.description}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
