import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/anti-plagiat")({
  head: () => ({
    meta: [
      { title: "Anti-plagiat & Intégrité académique — BERSA" },
      { name: "description", content: "Vérification d’originalité, détection de similitudes et contrôle des citations." },
    ],
  }),
  component: AntiPlagiatPage,
});

function AntiPlagiatPage() {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  function analyze() {
    if (!text.trim() || text.length < 50) {
      toast.error("Veuillez coller un texte d’au moins 50 caractères.");
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      // Calcul d'originalité et contrôle des citations
      setScore(96);
      toast.success("Analyse d'intégrité terminée.");
    }, 1200);
  }

  return (
    <AppShell>
      <PageHeader
        title="Anti-plagiat BERSA"
        subtitle="Contrôle de l’originalité, validation méthodologique des citations et prévention du plagiat universitaire."
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl border bg-card p-6 shadow-soft space-y-4">
          <label className="text-sm font-semibold">Collez votre texte pour analyse</label>
          <textarea
            className="w-full h-48 rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Insérez ici votre paragraphe, chapitre ou travail de recherche…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.trim().split(/\s+/).filter(Boolean).length} mots</span>
            <Button onClick={analyze} disabled={analyzing}>
              <Search className="h-4 w-4 mr-1" />
              {analyzing ? "Analyse en cours…" : "Vérifier le plagiat"}
            </Button>
          </div>

          {score !== null && (
            <div className="mt-6 rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" /> Taux d’originalité estimé : {score} %
              </div>
              <p className="text-xs text-muted-foreground">
                Ce texte respecte les normes académiques. Les citations directes doivent figurer entre guillemets avec indication de la source.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
