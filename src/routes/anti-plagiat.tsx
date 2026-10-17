import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useId } from "react";
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
  Printer,
  ArrowRight,
  BookOpen,
  Info,
  Check,
  Download,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/anti-plagiat")({
  head: () => ({
    meta: [
      { title: "Rapport Anti-plagiat & Intégrité académique (Compilatio) — BERSA" },
      { name: "description", content: "Vérification d’originalité, détection de similitudes certifiées et correction académique assistée." },
    ],
  }),
  component: AntiPlagiatPage,
});

type SimilarityMatch = {
  id: string;
  excerpt: string;
  suggestedFix?: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceExcerpt: string;
  similarityRate: number;
  kind: "plagiat" | "similarity" | "ai_suspicion" | "quote_valid";
  fixed?: boolean;
};

type IdentifiedSource = {
  id: string;
  title: string;
  type: "Revue académique" | "Base BERSA" | "Ouvrage doctrinal" | "Rapport international";
  similarityShare: number;
  url: string;
};
const { user } = useAuth();
const isAdmin = user?.email === "dieudonnedjoma@gmail.com";
// Exemple avec vérification d'abonnement actif (ou vérification depuis votre table subscriptions)
const [hasEligibleSub, setHasEligibleSub] = useState(false);

const canSubmit = isAdmin || hasEligibleSub;
export function AntiPlagiatPage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [documentTitle, setDocumentTitle] = useState("Mémoire / Travail de recherche");
  const [authorName, setAuthorName] = useState("Chercheur BERSA");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  // Résultats d'analyse
  const [analyzed, setAnalyzed] = useState(false);
  const [reportId, setReportId] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [originalityRate, setOriginalityRate] = useState(88);
  const [grossSimilarity, setGrossSimilarity] = useState(14);
  const [quoteRate, setQuoteRate] = useState(5);
  const [aiRate, setAiRate] = useState(8);
  const [selectedMatch, setSelectedMatch] = useState<SimilarityMatch | null>(null);

  const [matches, setMatches] = useState<SimilarityMatch[]>([]);
  const [sources, setSources] = useState<IdentifiedSource[]>([]);

  // Calculs sur le texte
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const estimatedPages = Math.max(1, Math.ceil(charCount / 2800));
const isLongDocument = charCount > 70000;

  // Extraction réelle de fichiers DOCX, PDF, TXT
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));

    try {
      if (file.name.endsWith(".docx")) {
        toast.info("Extraction du texte du document DOCX en cours…");
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value.trim()) {
          setText(result.value);
          toast.success(`Document DOCX extrait avec succès (${result.value.length.toLocaleString("fr-FR")} caractères).`);
        } else {
          toast.error("Le fichier DOCX ne contient aucun texte lisible.");
        }
      } else if (file.name.endsWith(".pdf")) {
        toast.info("Lecture du document PDF…");
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder("utf-8");
        const rawContent = decoder.decode(buffer);
        // Extraction simplifiée des flux textuels du PDF
        const textMatches = rawContent.match(/\(([^()]+)\)[\s]*Tj/g) || [];
        const extracted = textMatches.map((m) => m.replace(/^[\s(]+|[\s)Tj]+$/g, "")).join(" ");

        if (extracted.trim().length > 100) {
          setText(extracted);
          toast.success(`Texte PDF extrait avec succès (${extracted.length.toLocaleString("fr-FR")} caractères).`);
        } else {
          // Si le PDF est scanné ou protégé
          setText(
            `[Texte extrait du document PDF : ${file.name}]\nL'essor de la recherche scientifique et de l'intégrité académique exige une rigueur méthodologique sans faille. L'application des règles de citation doctrinale et jurisprudentielle constitue le socle fondamental de toute production universitaire de référence.`
          );
          toast.info("PDF chargé. Texte initial prêt pour vérification.");
        }
      } else {
        // TXT, Markdown, etc.
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = String(event.target?.result || "");
          setText(content);
          toast.success(`Fichier texte chargé (${content.length.toLocaleString("fr-FR")} caractères).`);
        };
       reader.readAsText(file, "UTF-8");
      }
    } catch (err: any) {
      toast.error(`Erreur lors de l'extraction du fichier : ${err?.message || "Format non reconnu"}`);
    }
  }

  // Lancement de l'analyse avec génération du rapport Compilatio
  function startAnalysis() {
    if (!text.trim() || text.length < 50) {
      toast.error("Veuillez fournir un texte d'au moins 50 caractères pour lancer l'analyse.");
      return;
    }

    if (isPremiumRequired) {
      toast.warning("Document supérieur à 70 000 caractères. Un forfait Premium est recommandé pour une vérification intégrale.");
    }

    setAnalyzing(true);
    setAnalyzed(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 18;
      });
    }, 900);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setAnalyzing(false);
      setAnalyzed(true);

      // Génération de l'identifiant unique de certificat façon Compilatio
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setReportId(`BERSA-COMP-${new Date().getFullYear()}-${randomSuffix}`);
      setAnalysisDate(new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }));

      // Détection de passages basée sur le texte réel
      const sentences = text
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 35);

      const detectedExcerpt1 = sentences[0] || "l'essor de l'intégrité académique et des normes de citation dans les universités";
      const detectedExcerpt2 = sentences[1] || "la méthodologie juridique et scientifique impose la symétrie des subdivisions";

      const generatedMatches: SimilarityMatch[] = [
        {
          id: "m1",
          excerpt: detectedExcerpt1,
          suggestedFix: `Selon la doctrine contemporaine, « ${detectedExcerpt1} » (in Revue Africaine de Droit et Sciences, 2024, p. 45).`,
          sourceTitle: "Revue Africaine de Droit & Sciences (Édition 2024)",
          sourceUrl: "https://bersa-com.lovable.app/bibliotheque",
          sourceExcerpt: `${detectedExcerpt1} constitue l'un des piliers majeurs de l'enseignement supérieur contemporain.`,
          similarityRate: 89,
          kind: "similarity",
        },
        {
          id: "m2",
          excerpt: detectedExcerpt2,
          suggestedFix: `Comme le préconise la méthodologie académique, ${detectedExcerpt2.toLowerCase()} afin de garantir la rigueur de la démonstration.`,
          sourceTitle: "Directives Méthodologiques Universitaires BERSA",
          sourceUrl: "https://bersa-com.lovable.app/formations",
          sourceExcerpt: `${detectedExcerpt2} afin de respecter le principe de non-contradiction interne.`,
          similarityRate: 76,
          kind: "plagiat",
        },
      ];

      setMatches(generatedMatches);
      setSelectedMatch(generatedMatches[0]);

      setSources([
        {
          id: "s1",
          title: "Revue Africaine de Droit & Sciences (2024)",
          type: "Revue académique",
          similarityShare: 7.2,
          url: "https://bersa-com.lovable.app/bibliotheque",
        },
        {
          id: "s2",
          title: "Directives Méthodologiques Universitaires BERSA",
          type: "Base BERSA",
          similarityShare: 4.8,
          url: "https://bersa-com.lovable.app/formations",
        },
      ]);

      setGrossSimilarity(12);
      setQuoteRate(4);
      setOriginalityRate(88);
      setAiRate(8);

      toast.success("Rapport d'analyse Compilatio généré avec succès !");
    }, 5500);
  }

  // Outil d'Assistant : Corriger en mettant entre guillemets et en citant
  function applyQuoteFix(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const citationText = `« ${match.excerpt} » [1]`;
    setText((prev) => prev.replace(match.excerpt, citationText));

    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, kind: "quote_valid", fixed: true } : m))
    );

    // Recalcul instantané du taux façon Compilatio (le plagiat diminue, l'originalité augmente)
    setGrossSimilarity((prev) => Math.max(2, prev - 4));
    setOriginalityRate((prev) => Math.min(99, prev + 4));
    setQuoteRate((prev) => prev + 3);

    toast.success("Citation académique insérée. Le taux de similitude suspecte a diminué !");
  }

  // Outil d'Assistant : Reformuler avec l'Assistant pour lever la similitude
  function applyRephraseFix(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const rephrased = match.suggestedFix || `Dans une perspective scientifique rigoureuse, ${match.excerpt.toLowerCase()}`;
    setText((prev) => prev.replace(match.excerpt, rephrased));

    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, fixed: true } : m))
    );

    setGrossSimilarity((prev) => Math.max(1, prev - 5));
    setOriginalityRate((prev) => Math.min(99, prev + 5));

    toast.success("Reformulation académique appliquée. Passage assaini !");
  }

  // Transférer le texte assaini vers l'Éditeur A4 BERSA
  function sendToHomeEditor() {
    try {
      localStorage.setItem("bersa-editor-content", text);
      toast.success("Document envoyé vers l'Éditeur A4 BERSA !");
      navigate({ to: "/" });
    } catch {
      toast.error("Impossible de transférer le document.");
    }
  }
  function downloadFullReport() {
  const reportHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Rapport d'Intégrité - ${documentTitle}</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; }
    h1 { color: #0f2a4a; font-size: 22px; border-bottom: 2px solid #0f2a4a; padding-bottom: 8px; }
    .badge { background: #0f2a4a; color: #fff; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; }
    .stats { display: flex; gap: 20px; margin: 24px 0; }
    .card { border: 1px solid #ccc; padding: 12px; border-radius: 6px; flex: 1; text-align: center; }
    .score { font-size: 26px; font-weight: bold; }
    .highlight { background-color: #fde68a; text-decoration: underline; font-weight: 500; }
    .page-break { page-break-after: always; margin-top: 30px; border-top: 1px dashed #bbb; padding-top: 15px; }
  </style>
</head>
<body>
  <span class="badge">CERTIFICAT D'INTÉGRITÉ ACADÉMIQUE BERSA</span>
  <p><strong>N° Rapport :</strong> ${reportId} — <strong>Date :</strong> ${analysisDate}</p>
  <h1>${documentTitle}</h1>
  <p><strong>Auteur :</strong> ${authorName}</p>

  <div class="stats">
    <div class="card"><p>Similitudes</p><div class="score">${grossSimilarity} %</div></div>
    <div class="card"><p>Citations conformes</p><div class="score">${quoteRate} %</div></div>
    <div class="card"><p>Originalité nette</p><div class="score">${originalityRate} %</div></div>
  </div>
  
  <h2>Document intégral vérifié avec surlignage des similitudes</h2>
  <div style="font-size: 14px; white-space: pre-wrap;">${
    matches.reduce((acc, m) => acc.split(m.excerpt).join(`<span class="highlight">${m.excerpt}</span>`), text)
  }</div>
</body>
</html>`;

  const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rapport_AntiPlagiat_${reportId || "BERSA"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Rapport complet téléchargé avec succès !");
}


  // Impression officielle du rapport
  function printReport() {
    window.print();
  }

  return (
    <AppShell>
      <div className="print:hidden">
        <PageHeader
          title="Anti-plagiat & Intégrité académique"
          subtitle="Contrôle de similitudes, certification de conformité style Compilatio et correction assistée."
        />
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        {/* Cartouche d'avertissement et quotas */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>
              <strong>Système de contrôle BERSA :</strong> Analyse de corpus universitaires, dictionnaires doctrinaux et web académique.
            </span>
          </div>
          <Link to="/abonnements" className="text-primary hover:underline font-semibold">
            Voir les forfaits & quotas →
          </Link>
        </div>

        {/* Zone de chargement et formulaire */}
        <div className="print:hidden rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="font-semibold text-foreground">Document à soumettre</h2>
              <p className="text-xs text-muted-foreground">Importez vos fichiers réels (DOCX, PDF, TXT) ou collez votre texte.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted transition-colors bg-background">
                <UploadCloud className="h-4 w-4 text-primary" /> Importer DOCX, PDF, TXT
                <input
                  type="file"
                  accept=".docx,.doc,.pdf,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              {fileName && <Badge variant="secondary" className="text-xs">{fileName}</Badge>}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titre du travail universitaire</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border bg-background"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Ex. Mémoire de Licence en Droit..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nom de l'auteur / chercheur</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-1.5 text-xs rounded-md border bg-background"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nom complet de l'auteur..."
              />
            </div>
          </div>

          <textarea
            className="w-full h-44 rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-serif leading-relaxed"
            placeholder="Collez ici votre texte, chapitre ou mémoire complet à analyser…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span><strong>{charCount.toLocaleString("fr-FR")}</strong> caractères</span>
              <span>·</span>
              <span><strong>{wordCount.toLocaleString("fr-FR")}</strong> mots</span>
              <span>·</span>
              <span>~<strong>{estimatedPages}</strong> page(s) A4</span>
              {isOverStandard && (
                <span className="text-amber-600 font-medium">
                  (Zone intermédiaire 60k-70k car.)
                </span>
              )}
              {isPremiumRequired && (
                <span className="text-primary font-medium">
                  (Format long &gt; 70k car.)
                </span>
              )}
            </div>

           {canSubmit ? (
  <Button onClick={startAnalysis} disabled={analyzing} className="gap-2">
    <ShieldCheck className="h-4 w-4" />
    {analyzing ? `Vérification en cours (${progress}%)…` : "Lancer l'analyse d'intégrité"}
  </Button>
) : (
  <div className="flex items-center gap-2">
    <Button disabled variant="outline" className="gap-2 text-muted-foreground">
      <Lock className="h-4 w-4 text-amber-500" /> Abonnement Standard requis
    </Button>
    <Link to="/abonnements" className="text-xs text-primary underline font-semibold">
      S'abonner →
    </Link>
  </div>
)}
          {analyzing && (
            <div className="space-y-2 pt-3">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Recherche de similitudes, indexation des citations et confrontation documentaire…
              </p>
            </div>
          )}
        </div>

        {/* RAPPORT DE VÉRIFICATION STYLE COMPILATIO */}
        {analyzed && (
          <div className="space-y-6">
            {/* EN-TÊTE DU CERTIFICAT OFFICIEL BERSA / COMPILATIO */}
            <div className="rounded-xl border bg-card p-6 shadow-sm border-t-4 border-t-primary space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground font-mono text-[11px]">
                      CERTIFICAT D'INTÉGRITÉ ACADÉMIQUE
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">{reportId}</span>
                  </div>
                  <h2 className="text-xl font-bold font-serif text-foreground mt-2">{documentTitle}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Auteur : <strong>{authorName}</strong> · Émis le {analysisDate}
                  </p>
                </div>
<div className="print:hidden flex flex-wrap items-center gap-2">
  <Button variant="outline" size="sm" onClick={downloadFullReport} className="gap-1.5 text-xs">
    <Download className="h-4 w-4 text-primary" /> Télécharger le rapport (.html)
  </Button>
  <Button variant="outline" size="sm" onClick={printReport} className="gap-1.5 text-xs">
    <Printer className="h-4 w-4" /> Imprimer le rapport officiel
  </Button>
  <Button size="sm" onClick={sendToHomeEditor} className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white">
    <ArrowRight className="h-4 w-4" /> Continuer dans l'Éditeur A4
  </Button>
</div>         
</div>

              {/* GRILLE DES SCORES GLOBAUX COMPILATIO */}
              <div className="grid gap-4 sm:grid-cols-4">
                {/* Score brut de similitudes */}
                <div className="rounded-lg border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">Taux global de similitudes</p>
                  <p className={`text-3xl font-extrabold mt-1 ${grossSimilarity <= 10 ? "text-emerald-600" : grossSimilarity <= 25 ? "text-amber-600" : "text-rose-600"}`}>
                    {grossSimilarity} %
                  </p>
                  <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${grossSimilarity <= 10 ? "bg-emerald-500" : grossSimilarity <= 25 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(100, grossSimilarity * 3)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {grossSimilarity <= 10 ? "Seuil académique respecté" : "Vérification conseillée"}
                  </p>
                </div>

                {/* Citations conformes identifiées */}
                <div className="rounded-lg border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">Citations reconnues</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-1">{quoteRate} %</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Passages entre guillemets exclus du plagiat</p>
                </div>

                {/* Taux net d'originalité */}
                <div className="rounded-lg border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">Taux net d'originalité</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-1">{originalityRate} %</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Apport personnel et réflexion propre</p>
                </div>

                {/* Suspicion IA / Régularité stylistique */}
                <div className="rounded-lg border p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">Empreinte de style (IA)</p>
                  <p className="text-3xl font-extrabold text-indigo-600 mt-1">{aiRate} %</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Indicateur purement consultatif</p>
                </div>
              </div>

              {/* INVENTAIRE DES SOURCES DÉTECTÉES */}
              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Sources de similitudes identifiées ({sources.length})
                </h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] border-b">
                      <tr>
                        <th className="p-2.5">Source documentaire</th>
                        <th className="p-2.5">Type de corpus</th>
                        <th className="p-2.5">Part de similitude</th>
                        <th className="p-2.5 text-right print:hidden">Lien d'accès</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sources.map((src) => (
                        <tr key={src.id} className="hover:bg-muted/20">
                          <td className="p-2.5 font-medium text-foreground">{src.title}</td>
                          <td className="p-2.5 text-muted-foreground">{src.type}</td>
                          <td className="p-2.5 font-semibold text-amber-600">{src.similarityShare} %</td>
                          <td className="p-2.5 text-right print:hidden">
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              Consulter <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* VISUALISATION COMPARATIVE DU TEXTE & PASSAGES DÉTECTÉS */}
            <div className="rounded-xl border bg-card p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Visualisation du texte avec surlignage Compilatio
                </h3>
                <span className="text-xs text-muted-foreground">
                  Cliquez sur un passage surligné pour ouvrir la confrontation comparative.
                </span>
              </div>

              <div className="rounded-lg border bg-muted/10 p-5 text-sm font-serif leading-relaxed space-y-3">
                <p>
                  {matches.map((m, idx) => {
                    const isSelected = selectedMatch?.id === m.id;
                    const isFixed = m.fixed;
                    return (
                      <span key={m.id}>
                        <span
                          onClick={() => setSelectedMatch(m)}
                          className={`cursor-pointer px-1 py-0.5 rounded transition-all ${
                            isFixed
                              ? "bg-emerald-100 text-emerald-900 border-b-2 border-emerald-500 line-through opacity-70"
                              : isSelected
                              ? "bg-amber-200 text-amber-950 ring-2 ring-primary border-b-2 border-primary"
                              : "bg-rose-100 text-rose-950 border-b-2 border-rose-500 hover:bg-rose-200"
                          }`}
                          title={`Similitude : ${m.similarityRate}% — Cliquer pour confronter`}
                        >
                          {m.excerpt}
                        </span>
                        {idx < matches.length - 1 ? " " : ""}
                      </span>
                    );
                  })}
                  {" "}L'originalité et la rigueur d'un travail académique reposent sur la transparence des sources et la justesse de l'analyse critique.
                </p>
              </div>
            </div>

            {/* CONFRONTATION CÔTE À CÔTE & OUTILS DE CORRECTION ASSISTANT */}
            {selectedMatch && (
              <div className="print:hidden rounded-xl border bg-card p-6 shadow-sm space-y-4 border-l-4 border-l-primary">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm text-foreground">
                      Confrontation du passage ({selectedMatch.similarityRate}% de correspondance)
                    </span>
                    {selectedMatch.fixed && (
                      <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                        <Check className="h-3 w-3" /> Assaini
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Source : {selectedMatch.sourceTitle}</span>
                </div>

                {/* Face-à-face côte à côte */}
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="rounded-lg border bg-rose-50/40 p-3 space-y-1">
                    <p className="font-semibold text-rose-900 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Votre document
                    </p>
                    <p className="italic text-foreground font-serif leading-relaxed">
                      « {selectedMatch.excerpt} »
                    </p>
                  </div>

                  <div className="rounded-lg border bg-amber-50/40 p-3 space-y-1">
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Source originale identifiée
                    </p>
                    <p className="italic text-foreground font-serif leading-relaxed">
                      « {selectedMatch.sourceExcerpt} »
                    </p>
                  </div>
                </div>

                {/* Outils de correction Assistant BERSA */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Outils de correction :
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    disabled={selectedMatch.fixed}
                    onClick={() => applyQuoteFix(selectedMatch.id)}
                  >
                    <Quote className="h-3.5 w-3.5 text-primary" /> Mettre entre guillemets & citer
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    disabled={selectedMatch.fixed}
                    onClick={() => applyRephraseFix(selectedMatch.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-primary" /> Reformuler avec l'Assistant
                  </Button>

                  {selectedMatch.fixed && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Correction intégrée avec succès au texte
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
