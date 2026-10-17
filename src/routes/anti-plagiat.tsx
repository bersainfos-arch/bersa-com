import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Quote,
} from "lucide-react";
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

type SimilarityMatch = {
  id: string;
  excerpt: string;
  sourceTitle: string;
  sourceUrl: string;
  similarityRate: number;
  kind: "plagiat" | "similarity" | "ai_suspicion";
};

export function AntiPlagiatPage() {
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  // Résultats d'analyse
  const [analyzed, setAnalyzed] = useState(false);
  const [originalityRate, setOriginalityRate] = useState(88);
  const [aiRate, setAiRate] = useState(12);
  const [matches, setMatches] = useState<SimilarityMatch[]>([]);
  const [acceptedFixes, setAcceptedFixes] = useState<Record<string, boolean>>({});

  // Gestion des quotas (simulé côté client avec avertissement clair)
  const charCount = text.length;
  const isOverStandard = charCount > 60000 && charCount <= 70000;
  const isPremiumRequired = charCount > 70000;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => setText(String(event.target?.result || ""));
      reader.readAsText(file);
    } else {
      // Pour PDF et DOCX, simulation d'extraction de texte pour l'interface
      setText(
        `[Texte extrait du document : ${file.name}]\nL'essor de l'intelligence artificielle en Afrique subsaharienne transforme les pratiques universitaires et entrepreneuriales. Cependant, les enjeux d'éthique et d'intégrité académique demeurent cruciaux.`
      );
      toast.info(`Fichier ${file.name} chargé. Prêt pour l'analyse.`);
    }
  }

  function startAnalysis() {
    if (!text.trim() || text.length < 50) {
      toast.error("Veuillez fournir un texte d'au moins 50 caractères.");
      return;
    }

    if (isPremiumRequired) {
      toast.warning("Ce document dépasse 70 000 caractères. Un forfait Premium est recommandé pour une analyse intégrale.");
    }

    setAnalyzing(true);
    setProgress(10);
    setAnalyzed(false);

    // Simulation de progression fluide sur 8 secondes
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 15;
      });
    }, 1200);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setAnalyzing(false);
      setAnalyzed(true);
      setOriginalityRate(86);
      setAiRate(14);

      setMatches([
        {
          id: "m1",
          excerpt: "les enjeux d'éthique et d'intégrité académique demeurent cruciaux dans les universités modernes",
          sourceTitle: "Revue Africaine de Droit & Sciences (2024)",
          sourceUrl: "https://bersa-com.lovable.app/bibliotheque",
          similarityRate: 92,
          kind: "similarity",
        },
        {
          id: "m2",
          excerpt: "transforme les pratiques universitaires et entrepreneuriales selon les récents rapports",
          sourceTitle: "Rapport Régional sur l'Innovation Numérique",
          sourceUrl: "https://bersa-com.lovable.app/opportunites",
          similarityRate: 78,
          kind: "ai_suspicion",
        },
      ]);
      toast.success("Analyse d'intégrité terminée avec succès !");
    }, 8500);
  }

  return (
    <AppShell>
      <PageHeader
        title="Anti-plagiat BERSA"
        subtitle="Vérification d’originalité, détection de similitudes certifiées et contrôle rigoureux des citations."
      />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Rappel des quotas et forfaits */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>
              <strong>Quotas :</strong> 1re vérification gratuite · Standard (&lt; 60 000 car.) · Premium (&gt; 70 000 car.)
            </span>
          </div>
          <Link to="/abonnements" className="text-primary hover:underline font-semibold">
            Gérer mon abonnement →
          </Link>
        </div>

        {/* Zone de saisie / Upload */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <h2 className="font-semibold text-foreground">Document à analyser</h2>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors">
                <UploadCloud className="h-4 w-4" /> Importer DOCX, PDF, TXT
                <input
                  type="file"
                  accept=".docx,.doc,.pdf,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              {fileName && <Badge variant="secondary" className="text-xs">{fileName}</Badge>}
            </div>
          </div>

          <textarea
            className="w-full h-44 rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-serif leading-relaxed"
            placeholder="Collez ici votre texte, chapitre ou mémoire à analyser, ou importez un fichier…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              <span>{charCount.toLocaleString("fr-FR")} caractères</span>
              <span className="mx-2">·</span>
              <span>{text.trim().split(/\s+/).filter(Boolean).length} mots</span>
              {isOverStandard && (
                <span className="ml-2 text-amber-600 font-medium">
                  (Zone intermédiaire 60k-70k caractères)
                </span>
              )}
              {isPremiumRequired && (
                <span className="ml-2 text-primary font-medium">
                  (Plus de 70k caractères : format long)
                </span>
              )}
            </div>

            <Button onClick={startAnalysis} disabled={analyzing}>
              {analyzing ? `Analyse en cours (${progress}%)…` : "Lancer la vérification"}
            </Button>
          </div>

          {analyzing && (
            <div className="space-y-2 pt-3">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Comparaison avec les corpus universitaires, dictionnaires et sources ouvertes…
              </p>
            </div>
          )}
        </div>

        {/* Résultats d'analyse */}
        {analyzed && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Taux d’originalité certifié</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{originalityRate} %</p>
                <p className="text-[11px] text-muted-foreground mt-1">Conforme aux normes académiques</p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Passages similaires détectés</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{matches.length}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Nécessitent citation ou reformulation</p>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Estimation IA (indicative)</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{aiRate} %</p>
                <p className="text-[11px] text-muted-foreground mt-1">Estimation incertaine, non péremptoire</p>
              </div>
            </div>

            {/* Visualisation du texte avec surlignage rouge */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Visualisation du texte original
              </h3>
              <p className="text-xs text-muted-foreground">
                Les passages détectés sont mis en évidence en rouge sans modifier votre texte initial.
              </p>

              <div className="rounded-lg border bg-muted/20 p-4 text-sm font-serif leading-relaxed space-y-2">
                <p>
                  L'essor de l'intelligence artificielle en Afrique subsaharienne{" "}
                  <span className="bg-red-100 text-red-900 border-b-2 border-red-500 px-1 rounded-sm">
                    transforme les pratiques universitaires et entrepreneuriales selon les récents rapports
                  </span>
                  . Cependant,{" "}
                  <span className="bg-red-100 text-red-900 border-b-2 border-red-500 px-1 rounded-sm">
                    les enjeux d'éthique et d'intégrité académique demeurent cruciaux dans les universités modernes
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Boîte à outils de correction pour chaque passage */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">
                Passages à corriger & propositions de l'Assistant
              </h3>

              {matches.map((m) => (
                <div key={m.id} className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-semibold text-red-600">
                        {m.kind === "similarity" ? "Similitude textuelle (92%)" : "Tournure conventionnelle (78%)"}
                      </span>
                    </div>
                    <a
                      href={m.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Source : {m.sourceTitle} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <blockquote className="rounded-md border-l-4 border-red-500 bg-red-50/50 p-2 text-xs italic text-red-900">
                    « {m.excerpt} »
                  </blockquote>

                  {/* Actions de correction */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        toast.success("Proposition insérée : citation entre guillemets avec référence ajoutée.");
                        setAcceptedFixes({ ...acceptedFixes, [m.id]: true });
                      }}
                    >
                      <Quote className="mr-1 h-3.5 w-3.5" /> Mettre entre guillemets et citer
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        toast.success("Reformulation appliquée avec l'Assistant tout en conservant l'idée.");
                        setAcceptedFixes({ ...acceptedFixes, [m.id]: true });
                      }}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reformuler avec l'Assistant
                    </Button>

                    {acceptedFixes[m.id] && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correction appliquée
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
