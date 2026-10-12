import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Repeat, ListTree, Expand, AlignLeft, SpellCheck, Star, BookMarked, Languages, Lightbulb,
  Send, Loader2, Copy, FilePlus2, FileText,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { runWriter } from "@/lib/writer.functions";
import { QuotaMeter, useDailyQuota } from "@/components/QuotaMeter";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — BERSA" },
      { name: "description", content: "Barre IA centrale et 18 modèles de documents pour rédiger plus vite avec BERSA." },
      { property: "og:title", content: "Tableau de bord — BERSA" },
      { property: "og:description", content: "Reformulez, structurez et démarrez vos documents à partir de 18 modèles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const ACTIONS = [
  { id: "rephrase", label: "Reformuler", icon: Repeat },
  { id: "outline", label: "Plan", icon: ListTree },
  { id: "expand", label: "Développer", icon: Expand },
  { id: "summarize", label: "Résumer", icon: AlignLeft },
  { id: "correct", label: "Corriger", icon: SpellCheck },
  { id: "improve", label: "Améliorer", icon: Star },
  { id: "references", label: "Source", icon: BookMarked },
  { id: "translate", label: "Traduire", icon: Languages },
  { id: "suggest", label: "Suggestions", icon: Lightbulb },
] as const;

const h = (t: string, sections: string[]) =>
  `<h1 style="text-align:center">${t}</h1>` + sections.map((s) => `<h2>${s}</h2><p>…</p>`).join("");

const TEMPLATES: { title: string; category: string; desc: string; sections: string[] }[] = [
  { title: "Mémoire de fin d'études", category: "academique", desc: "Structure complète du mémoire", sections: ["Introduction", "Revue de littérature", "Méthodologie", "Résultats", "Discussion", "Conclusion", "Bibliographie"] },
  { title: "Thèse de doctorat", category: "academique", desc: "Chapitres et cadre théorique", sections: ["Introduction générale", "Cadre théorique", "Méthodologie", "Analyses", "Conclusion générale", "Références"] },
  { title: "Article scientifique", category: "academique", desc: "Format IMRaD", sections: ["Résumé", "Introduction", "Matériel et méthodes", "Résultats", "Discussion", "Références"] },
  { title: "Projet de recherche", category: "academique", desc: "Problématique, objectifs, calendrier", sections: ["Contexte", "Problématique", "Objectifs", "Hypothèses", "Méthodologie", "Calendrier", "Budget"] },
  { title: "Rapport de stage", category: "academique", desc: "Présentation de l'entreprise et missions", sections: ["Introduction", "Présentation de la structure", "Missions réalisées", "Apports du stage", "Conclusion"] },
  { title: "Travail pratique (TP)", category: "academique", desc: "Compte rendu de travaux", sections: ["Objectif", "Matériel", "Protocole", "Résultats", "Interprétation"] },
  { title: "Dissertation", category: "academique", desc: "Thèse, antithèse, synthèse", sections: ["Introduction", "Première partie", "Deuxième partie", "Troisième partie", "Conclusion"] },
  { title: "Résumé d'ouvrage", category: "academique", desc: "Fiche de lecture", sections: ["Références de l'ouvrage", "Résumé", "Idées principales", "Analyse critique"] },
  { title: "Curriculum vitae", category: "administratif", desc: "CV professionnel", sections: ["Profil", "Expériences", "Formation", "Compétences", "Langues", "Centres d'intérêt"] },
  { title: "Lettre de motivation", category: "administratif", desc: "Candidature emploi ou bourse", sections: ["Objet", "Accroche", "Motivation", "Compétences", "Formule de politesse"] },
  { title: "Demande d'emploi", category: "administratif", desc: "Lettre de demande", sections: ["Objet", "Corps de la demande", "Formule de politesse"] },
  { title: "Rapport d'activités", category: "administratif", desc: "Bilan périodique", sections: ["Résumé", "Activités réalisées", "Difficultés", "Perspectives"] },
  { title: "Procès-verbal de réunion", category: "administratif", desc: "Compte rendu officiel", sections: ["Participants", "Ordre du jour", "Délibérations", "Décisions", "Clôture"] },
  { title: "Note de service", category: "administratif", desc: "Communication interne", sections: ["Objet", "Destinataires", "Contenu", "Signature"] },
  { title: "Business plan", category: "general", desc: "Projet d'entreprise", sections: ["Résumé exécutif", "Marché", "Offre", "Stratégie", "Prévisions financières"] },
  { title: "Proposition de projet", category: "general", desc: "Demande de financement", sections: ["Contexte", "Objectifs", "Activités", "Résultats attendus", "Budget"] },
  { title: "Contrat", category: "juridique", desc: "Contrat entre parties", sections: ["Parties", "Objet", "Obligations", "Durée", "Résiliation", "Signatures"] },
  { title: "Requête juridique", category: "juridique", desc: "Requête adressée à une juridiction", sections: ["Juridiction", "Exposé des faits", "Moyens", "Par ces motifs"] },
];

function Page() {
  const nav = useNavigate();
  const ask = useServerFn(runWriter);
  const { quota, setQuota } = useDailyQuota();
  const [action, setAction] = useState<string>("rephrase");
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!text.trim()) { toast.error("Saisissez un texte."); return; }
    setBusy(true);
    try {
      const r = await ask({ data: { action, messages: [{ role: "user", content: text }] } });
      setReply(r.reply);
      setQuota({ used: r.used, limit: r.limit });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      toast.error(msg.startsWith("QUOTA_EXHAUSTED") ? "Limite quotidienne atteinte — consultez les abonnements." : msg);
    } finally {
      setBusy(false);
    }
  }

  async function createDoc(title: string, category: string, content: string) {
    const { data, error } = await supabase.from("user_docs").insert({ title, category, content }).select("id").single();
    if (error) { toast.error(error.message); return; }
    nav({ to: "/editeur/$id", params: { id: data.id } });
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  return (
    <AppShell>
      <PageHeader title="Tableau de bord" subtitle="Transformez vos idées en résultats" />
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-3"><QuotaMeter quota={quota} /></div>
          <div className="mb-3 flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${action === a.id ? "border-gold bg-gold text-gold-foreground font-semibold" : "hover:bg-muted"}`}
              >
                <a.icon className="h-4 w-4" /> {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Collez ou écrivez votre texte, puis choisissez une action…"
              className="min-h-28"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
            />
            <Button onClick={run} disabled={busy} className="self-end" aria-label="Envoyer">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {reply && (
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(reply); toast.success("Copié"); }}>
                  <Copy className="mr-1 h-4 w-4" /> Copier
                </Button>
                <Button size="sm" variant="outline" onClick={() => createDoc("Texte assisté", "general", reply.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join(""))}>
                  <FilePlus2 className="mr-1 h-4 w-4" /> Ouvrir dans un document
                </Button>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-3xl font-bold">18 modèles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => createDoc(t.title, t.category, h(t.title, t.sections))}
                className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-soft transition hover:border-gold"
              >
                <FileText className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                <span>
                  <span className="block font-semibold">{t.title}</span>
                  <span className="text-sm text-muted-foreground">{t.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
