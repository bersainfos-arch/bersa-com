import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Crown, Download, FileText, Printer, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CV_CATEGORIES, CV_TEMPLATES, SAMPLE_CV, renderCvHtml, type CvData, type CvTemplate } from "@/lib/cv-templates";

export const Route = createFileRoute("/cv-studio")({
  head: () => ({
    meta: [
      { title: "CV Studio — 120 modèles de CV éditables | BERSA" },
      { name: "description", content: "Choisissez parmi 120 modèles de CV professionnels, remplissez vos informations et exportez en Word ou PDF." },
      { property: "og:title", content: "CV Studio BERSA — 120 modèles de CV" },
      { property: "og:description", content: "Modèles de CV modernes, éditables et exportables en Word ou PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CvStudio,
});

const FIELDS: { key: keyof CvData; label: string; multi?: boolean }[] = [
  { key: "fullName", label: "Nom complet" }, { key: "title", label: "Poste visé" },
  { key: "email", label: "E-mail" }, { key: "location", label: "Ville, pays" },
  { key: "summary", label: "Profil", multi: true }, { key: "experience", label: "Expérience (une ligne par élément)", multi: true },
  { key: "education", label: "Formation", multi: true }, { key: "skills", label: "Compétences (séparées par des virgules)" },
  { key: "languages", label: "Langues (séparées par des virgules)" },
];

function CvStudio() {
  const [cat, setCat] = useState("Tous");
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [sel, setSel] = useState<CvTemplate | null>(null);
  const [data, setData] = useState<CvData>(SAMPLE_CV);

  useEffect(() => {
    const saved = localStorage.getItem("bersa-cv-data");
    if (saved) try { setData({ ...SAMPLE_CV, ...JSON.parse(saved) }); } catch { /* ignore */ }
  }, []);

  const list = useMemo(() => CV_TEMPLATES.filter((t) =>
    (cat === "Tous" || t.category === cat) && (tier === "all" || (tier === "premium") === t.premium)), [cat, tier]);

  const html = sel ? renderCvHtml(sel, data) : "";
  const fileName = (data.fullName || "cv").replace(/[^\w-]+/g, "_");

  const exportWord = () => {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:A4;margin:0}</style></head><body>${html}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + doc], { type: "application/msword" }));
    a.download = `${fileName}.doc`; a.click(); URL.revokeObjectURL(a.href);
  };
  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Autorisez les fenêtres pour exporter en PDF."); return; }
    w.document.write(`<html><head><title>${fileName}</title><style>@page{size:A4;margin:0}body{margin:0}</style></head><body>${html}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };

  if (sel) return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSel(null)}><ArrowLeft className="h-4 w-4" /> Modèles</Button>
          <span className="font-semibold">{sel.name}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { localStorage.setItem("bersa-cv-data", JSON.stringify(data)); toast.success("CV enregistré"); }}><Save className="h-4 w-4" /> Enregistrer</Button>
            <Button size="sm" variant="outline" onClick={exportWord}><Download className="h-4 w-4" /> Word</Button>
            <Button size="sm" onClick={exportPdf}><Printer className="h-4 w-4" /> PDF</Button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="space-y-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="block text-xs font-medium text-muted-foreground">{f.label}
                {f.multi
                  ? <textarea rows={3} className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground" value={data[f.key]} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />
                  : <input className="mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground" value={data[f.key]} onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />}
              </label>
            ))}
          </div>
          <div className="overflow-x-auto rounded-md border bg-muted p-2">
            <div className="mx-auto w-[794px] max-w-none bg-background shadow" style={{ minHeight: 1123 }} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-3">
        <h1 className="font-serif text-2xl font-bold">CV Studio</h1>
        <p className="mb-3 text-sm text-muted-foreground">{CV_TEMPLATES.length} modèles professionnels, éditables et exportables en Word ou PDF.</p>
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {["Tous", ...CV_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-3 py-1 text-xs ${cat === c ? "bg-primary text-primary-foreground" : "bg-background"}`}>{c}</button>
          ))}
        </div>
        <div className="mb-3 flex gap-2">
          {([["all", "Tous"], ["free", "Gratuits"], ["premium", "Premium"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTier(k)} className={`rounded-md border px-3 py-1 text-xs ${tier === k ? "bg-secondary font-semibold" : ""}`}>{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((t) => (
            <button key={t.id} onClick={() => setSel(t)} className="group overflow-hidden rounded-lg border bg-card text-left transition hover:shadow-md">
              <div className="relative h-40 overflow-hidden bg-muted">
                <div className="pointer-events-none origin-top-left" style={{ width: 794, transform: "scale(0.22)" }} dangerouslySetInnerHTML={{ __html: renderCvHtml(t, SAMPLE_CV) }} />
                {t.premium && <span className="absolute right-1 top-1 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground"><Crown className="h-3 w-3" /> Premium</span>}
              </div>
              <div className="p-2"><div className="truncate text-xs font-semibold">{t.name}</div><div className="flex items-center gap-1 text-[10px] text-muted-foreground"><FileText className="h-3 w-3" />{t.category}</div></div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
