import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Repeat, ListTree, Expand, AlignLeft, SpellCheck, Star, BookMarked, Languages, Lightbulb,
  Send, Loader2, Copy, FilePlus2, FileText, Clock, Star as StarIcon, Share2, Search, Bold, Italic,
  Underline, List, ListOrdered, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Table, Link2,
  Eraser, MessageSquare, User, Settings, CreditCard, BookOpen, GraduationCap, Briefcase, PenLine, Bot,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type RecentDoc = { id: string; title: string; category: string; word_count: number; favorite: boolean; updated_at: string };

function RecentDocs() {
  const nav = useNavigate();
  const [docs, setDocs] = useState<RecentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      const { data } = await supabase
        .from("user_docs")
        .select("id, title, category, word_count, favorite, updated_at")
        .order("updated_at", { ascending: false })
        .limit(6);
      if (on) { setDocs((data as RecentDoc[] | null) ?? []); setLoading(false); }
    })();
    return () => { on = false; };
  }, []);

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }
  if (docs.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun document pour l'instant — choisissez un modèle ci-dessous pour commencer.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((d) => (
        <button
          key={d.id}
          onClick={() => nav({ to: "/editeur/$id", params: { id: d.id } })}
          className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-soft transition hover:border-gold"
        >
          <FileText className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="truncate">{d.title}</span>
              {d.favorite && <StarIcon className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" />}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {d.word_count} mot{d.word_count > 1 ? "s" : ""} · modifié le {new Date(d.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

const QUICK = [
  { to: "/assistant", label: "Assistant IA", icon: Bot },
  { to: "/documents", label: "Mes documents", icon: FileText },
  { to: "/redaction", label: "Rédaction", icon: PenLine },
  { to: "/bibliotheque", label: "Bibliothèque", icon: BookOpen },
  { to: "/formations", label: "Formations", icon: GraduationCap },
  { to: "/opportunites", label: "Opportunités", icon: Briefcase },
] as const;

const ACCOUNT = [
  { to: "/profil", label: "Profil", icon: User },
  { to: "/profil", label: "Paramètres", icon: Settings },
  { to: "/abonnements", label: "Abonnements", icon: CreditCard },
] as const;

function greeting() {
  const hr = new Date().getHours();
  return hr < 12 ? "Bonjour" : hr < 18 ? "Bon après-midi" : "Bonsoir";
}

type Conv = { content: string; action?: string };

function Page() {
  const nav = useNavigate();
  const ask = useServerFn(runWriter);
  const { quota, setQuota } = useDailyQuota();
  const [action, setAction] = useState<string>("rephrase");
  const [tab, setTab] = useState<"accueil" | "insertion" | "ia">("ia");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [hello, setHello] = useState("Bienvenue");
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [allDocs, setAllDocs] = useState<{ id: string; title: string }[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHello(greeting());
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: p } = await supabase.from("profiles").select("first_name").eq("id", u.user.id).maybeSingle();
        setName(p?.first_name ?? "");
      }
      const { data } = await supabase.from("user_docs").select("id, title").order("updated_at", { ascending: false }).limit(200);
      setAllDocs(data ?? []);
    })();
    try {
      const m = JSON.parse(localStorage.getItem("bersa-assistant-history") ?? "[]") as (Conv & { role: string })[];
      setConvs(m.filter((x) => x.role === "user").slice(-5).reverse());
    } catch { /* ignore */ }
  }, []);

  const cmd = (c: string, v?: string) => { sheet.current?.focus(); document.execCommand(c, false, v); };

  async function run() {
    const text = sheet.current?.innerText.trim() ?? "";
    if (!text) { toast.error("Saisissez un texte."); return; }
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

  async function share() {
    const url = window.location.origin;
    const data = { title: "BERSA — Berceau du Savoir", text: "Le berceau du savoir, au service de votre plume", url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(url); toast.success("Lien de l'application copié"); }
    } catch { /* annulé */ }
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const term = q.trim().toLowerCase();
  const results = term ? [
    ...allDocs.filter((d) => d.title.toLowerCase().includes(term)).slice(0, 5).map((d) => ({ k: "doc" + d.id, label: d.title, kind: "Document", go: () => nav({ to: "/editeur/$id", params: { id: d.id } }) })),
    ...[...QUICK, ...ACCOUNT].filter((x) => x.label.toLowerCase().includes(term)).map((x) => ({ k: "nav" + x.label, label: x.label, kind: "Fonctionnalité", go: () => nav({ to: x.to }) })),
    ...TEMPLATES.filter((t) => t.title.toLowerCase().includes(term)).slice(0, 5).map((t) => ({ k: "tpl" + t.title, label: t.title, kind: "Modèle", go: () => createDoc(t.title, t.category, h(t.title, t.sections)) })),
    ...convs.filter((c) => c.content.toLowerCase().includes(term)).map((c, i) => ({ k: "cv" + i, label: c.content.slice(0, 70), kind: "Conversation", go: () => nav({ to: "/assistant" }) })),
  ] : [];

  const Rb = ({ icon: I, label, onClick }: { icon: typeof Bold; label: string; onClick: () => void }) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded px-2 py-1 text-[11px] hover:bg-muted">
      <I className="h-4 w-4" /><span className="hidden sm:block">{label}</span>
    </button>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">{hello}{name ? `, ${name}` : ""} 👋</h1>
            <p className="text-muted-foreground">Transformez vos idées en résultats</p>
          </div>
          <Button onClick={share} variant="outline" className="border-gold"><Share2 className="mr-2 h-4 w-4 text-gold" /> Partager l'application</Button>
        </div>

        {/* Recherche globale */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher documents, modèles, conversations, fonctionnalités…" className="h-12 pl-10" />
          {term && (
            <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg">
              {results.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Aucun résultat.</p> : results.map((r) => (
                <button key={r.k} onClick={() => { setQ(""); r.go(); }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
                  <span className="truncate">{r.label}</span><span className="shrink-0 text-xs text-gold">{r.kind}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Barre IA style Word */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="flex items-center gap-1 bg-primary px-3 pt-2 text-primary-foreground">
            {([["accueil", "Accueil"], ["insertion", "Insertion"], ["ia", "IA BERSA"]] as const).map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} className={`rounded-t-md px-4 py-1.5 text-sm ${tab === id ? "bg-card text-foreground font-semibold" : "opacity-80 hover:opacity-100"}`}>{l}</button>
            ))}
            <div className="ml-auto pb-1"><Button size="sm" variant="secondary" onClick={run} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />} Lancer</Button></div>
          </div>
          <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
            {tab === "accueil" && <>
              <Rb icon={Undo2} label="Annuler" onClick={() => cmd("undo")} />
              <Rb icon={Redo2} label="Rétablir" onClick={() => cmd("redo")} />
              <Rb icon={Bold} label="Gras" onClick={() => cmd("bold")} />
              <Rb icon={Italic} label="Italique" onClick={() => cmd("italic")} />
              <Rb icon={Underline} label="Souligné" onClick={() => cmd("underline")} />
              <Rb icon={List} label="Puces" onClick={() => cmd("insertUnorderedList")} />
              <Rb icon={ListOrdered} label="Numéros" onClick={() => cmd("insertOrderedList")} />
              <Rb icon={AlignLeft} label="Gauche" onClick={() => cmd("justifyLeft")} />
              <Rb icon={AlignCenter} label="Centrer" onClick={() => cmd("justifyCenter")} />
              <Rb icon={AlignRight} label="Droite" onClick={() => cmd("justifyRight")} />
              <Rb icon={AlignJustify} label="Justifier" onClick={() => cmd("justifyFull")} />
              <Rb icon={Eraser} label="Effacer format" onClick={() => cmd("removeFormat")} />
            </>}
            {tab === "insertion" && <>
              <Rb icon={Table} label="Tableau" onClick={() => cmd("insertHTML", '<table border="1" style="border-collapse:collapse;width:100%"><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p></p>')} />
              <Rb icon={Link2} label="Lien" onClick={() => { const u = prompt("Adresse du lien"); if (u) cmd("createLink", u); }} />
              <Rb icon={FilePlus2} label="Nouveau document" onClick={() => createDoc("Nouveau document", "general", sheet.current?.innerHTML || "<p></p>")} />
            </>}
            {tab === "ia" && ACTIONS.map((a) => (
              <button key={a.id} onClick={() => setAction(a.id)}
                className={`flex flex-col items-center gap-0.5 rounded px-2 py-1 text-[11px] ${action === a.id ? "bg-gold text-gold-foreground font-semibold" : "hover:bg-muted"}`}>
                <a.icon className="h-4 w-4" /> {a.label}
              </button>
            ))}
          </div>
          <div className="space-y-3 bg-muted/40 p-4">
            <QuotaMeter quota={quota} />
            <div ref={sheet} contentEditable suppressContentEditableWarning
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
              data-placeholder="Écrivez ou collez votre texte, choisissez une action IA puis « Lancer » (Ctrl+Entrée)…"
              className="mx-auto min-h-48 w-full max-w-[794px] rounded bg-white p-8 text-black shadow-md outline-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]"
              style={{ fontFamily: "'Times New Roman', serif", fontSize: "13pt", lineHeight: 1.6 }} />
            {reply && (
              <div className="mx-auto max-w-[794px] rounded-xl border bg-card p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(reply); toast.success("Copié"); }}><Copy className="mr-1 h-4 w-4" /> Copier</Button>
                  <Button size="sm" variant="outline" onClick={() => { if (sheet.current) sheet.current.innerText = reply; }}><Repeat className="mr-1 h-4 w-4" /> Remplacer le texte</Button>
                  <Button size="sm" variant="outline" onClick={() => createDoc("Texte assisté", "general", reply.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join(""))}><FilePlus2 className="mr-1 h-4 w-4" /> Ouvrir dans un document</Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Accès rapides + compte */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-3 font-display text-2xl font-bold">Accès rapides</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {QUICK.map((x) => (
                <button key={x.label} onClick={() => nav({ to: x.to })} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-soft transition hover:border-gold">
                  <x.icon className="h-5 w-5 text-gold" /><span className="font-semibold">{x.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-display text-2xl font-bold">Mon compte</h2>
            <div className="space-y-2">
              {ACCOUNT.map((x) => (
                <button key={x.label} onClick={() => nav({ to: x.to })} className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-gold">
                  <x.icon className="h-5 w-5 text-gold" />{x.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Historique */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Clock className="h-5 w-5 text-gold" /> Documents récents</h2>
              <Button variant="outline" size="sm" onClick={() => nav({ to: "/documents" })}>Tous mes documents</Button>
            </div>
            <RecentDocs />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><MessageSquare className="h-5 w-5 text-gold" /> Conversations</h2>
            </div>
            {convs.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Aucune conversation récente.</p>
            ) : (
              <div className="space-y-2">
                {convs.map((c, i) => (
                  <button key={i} onClick={() => nav({ to: "/assistant" })} className="block w-full truncate rounded-xl border bg-card p-3 text-left text-sm hover:border-gold">{c.content}</button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold">18 modèles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <button key={t.title} onClick={() => createDoc(t.title, t.category, h(t.title, t.sections))}
                className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-soft transition hover:border-gold">
                <FileText className="mt-0.5 h-6 w-6 shrink-0 text-gold" />
                <span><span className="block font-semibold">{t.title}</span><span className="text-sm text-muted-foreground">{t.desc}</span></span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
