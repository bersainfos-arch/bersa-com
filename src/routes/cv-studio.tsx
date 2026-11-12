import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Crown, Download, FileText, ImagePlus, Plus, Printer, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CvPreview } from "@/components/CvPreview";
import {
  CV_CATEGORIES, CV_TEMPLATES, SAMPLE_CV, EMPTY_CV, renderCvHtml,
  type CvData, type CvEducation, type CvExperience, type CvTemplate,
} from "@/lib/cv-templates";

export const Route = createFileRoute("/cv-studio")({
  head: () => ({
    meta: [
      { title: "CV Studio — 120 modèles de CV éditables | BERSA" },
      { name: "description", content: "100 modèles de CV modernes et 20 classiques : modifiez librement chaque information et exportez en Word ou PDF." },
      { property: "og:title", content: "CV Studio BERSA — 120 modèles de CV" },
      { property: "og:description", content: "Modèles de CV modernes et classiques, éditables et exportables en Word ou PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CvStudio,
});

const STORE = "bersa-cv-data-v2";
const inputCls = "mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="rounded-lg border bg-card p-3">
      <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  );
}

function Field({ label, value, onChange, multi }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">{label}
      {multi
        ? <textarea rows={3} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  const current = c[i]; const target = c[j];
  if (current === undefined || target === undefined) return arr;
  c[i] = target; c[j] = current;
  return c;
}

function ItemTools({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onUp} aria-label="Monter"><ArrowUp className="h-3.5 w-3.5" /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onDown} aria-label="Descendre"><ArrowDown className="h-3.5 w-3.5" /></Button>
      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete} aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function StringList({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <Section title={label}>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1">
          <input className={inputCls + " mt-0"} value={it} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} />
          <ItemTools onUp={() => onChange(move(items, i, -1))} onDown={() => onChange(move(items, i, 1))} onDelete={() => onChange(items.filter((_, k) => k !== i))} />
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, ""])}><Plus className="h-4 w-4" /> Ajouter</Button>
    </Section>
  );
}

function CvStudio() {
  const [cat, setCat] = useState<string>("Tous");
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [sel, setSel] = useState<CvTemplate | null>(null);
  const [data, setData] = useState<CvData>(EMPTY_CV);

  useEffect(() => {
    const saved = localStorage.getItem(STORE);
    if (saved) try { setData({ ...EMPTY_CV, ...JSON.parse(saved) }); } catch { /* ignore */ }
  }, []);

  const set = <K extends keyof CvData>(k: K, v: CvData[K]) => setData((d) => ({ ...d, [k]: v }));

  const list = useMemo(() => CV_TEMPLATES.filter((t) =>
    (cat === "Tous" || t.category === cat) && (tier === "all" || (tier === "premium") === t.premium)), [cat, tier]);

  const html = sel ? renderCvHtml(sel, data) : "";
  const fileName = (`${data.firstName}_${data.lastName}` || "cv").replace(/[^\w-]+/g, "_");

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Photo trop lourde (3 Mo maximum)."); return; }
    const r = new FileReader();
    r.onload = () => set("photo", String(r.result));
    r.readAsDataURL(file);
  };

  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(data)); toast.success("CV enregistré sur cet appareil"); }
    catch { toast.error("Espace insuffisant : essayez une photo plus légère."); }
  };
  const exportWord = () => {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:A4;margin:0}body{margin:0}</style></head><body>${html}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + doc], { type: "application/msword" }));
    a.download = `${fileName}.doc`; a.click(); URL.revokeObjectURL(a.href);
  };
  const exportPdf = () => {
    const w = window.open("", "_blank");
    if (!w) { toast.error("Autorisez les fenêtres pour exporter en PDF."); return; }
    w.document.write(`<html><head><title>${fileName}</title><style>@page{size:A4;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${html}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
  };

  const updExp = (i: number, patch: Partial<CvExperience>) => set("experiences", data.experiences.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const updEdu = (i: number, patch: Partial<CvEducation>) => set("education", data.education.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  if (sel) return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSel(null)}><ArrowLeft className="h-4 w-4" /> Modèles</Button>
          <span className="font-semibold">{sel.name}</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={save}><Save className="h-4 w-4" /> Enregistrer</Button>
            <Button size="sm" variant="outline" onClick={exportWord}><Download className="h-4 w-4" /> Word</Button>
            <Button size="sm" onClick={exportPdf}><Printer className="h-4 w-4" /> PDF</Button>
          </div>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="min-w-0 space-y-2">
            <Section title="Photo et identité">
              <div className="flex items-center gap-3">
                {data.photo ? <img src={data.photo} alt="Votre photo" className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="space-y-1">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs"><ImagePlus className="h-3.5 w-3.5" /> Choisir une photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  </label>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={data.showPhoto} onChange={(e) => set("showPhoto", e.target.checked)} /> Afficher la photo</label>
                  {data.photo && <button type="button" className="text-xs text-destructive" onClick={() => set("photo", "")}>Retirer la photo</button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Prénom" value={data.firstName} onChange={(v) => set("firstName", v)} />
                <Field label="Nom" value={data.lastName} onChange={(v) => set("lastName", v)} />
              </div>
              <Field label="Métier / poste visé" value={data.title} onChange={(v) => set("title", v)} />
              <Field label="Profil (à propos de moi)" value={data.summary} onChange={(v) => set("summary", v)} multi />
            </Section>
            <Section title="Coordonnées">
              <Field label="Adresse" value={data.address} onChange={(v) => set("address", v)} />
              <Field label="E-mail" value={data.email} onChange={(v) => set("email", v)} />
              <Field label="Téléphone" value={data.phone} onChange={(v) => set("phone", v)} />
              <Field label="Date de naissance" value={data.birth} onChange={(v) => set("birth", v)} />
              <Field label="Permis" value={data.license} onChange={(v) => set("license", v)} />
              <Field label="Site web / LinkedIn" value={data.website} onChange={(v) => set("website", v)} />
              <p className="text-[11px] text-muted-foreground">Une case vide n'apparaît pas sur le CV.</p>
            </Section>
            <Section title="Expériences professionnelles">
              {data.experiences.map((e, i) => (
                <div key={i} className="space-y-1 rounded-md border p-2">
                  <div className="flex items-center justify-between text-xs font-semibold">Expérience {i + 1}
                    <ItemTools onUp={() => set("experiences", move(data.experiences, i, -1))} onDown={() => set("experiences", move(data.experiences, i, 1))} onDelete={() => set("experiences", data.experiences.filter((_, k) => k !== i))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Début" value={e.start} onChange={(v) => updExp(i, { start: v })} />
                    <Field label="Fin" value={e.end} onChange={(v) => updExp(i, { end: v })} />
                  </div>
                  <Field label="Poste" value={e.role} onChange={(v) => updExp(i, { role: v })} />
                  <Field label="Entreprise" value={e.company} onChange={(v) => updExp(i, { company: v })} />
                  <Field label="Missions (commencez une ligne par « - » pour une puce)" value={e.description} onChange={(v) => updExp(i, { description: v })} multi />
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={() => set("experiences", [...data.experiences, { start: "", end: "", role: "", company: "", description: "" }])}><Plus className="h-4 w-4" /> Ajouter une expérience</Button>
            </Section>
            <Section title="Formations">
              {data.education.map((e, i) => (
                <div key={i} className="space-y-1 rounded-md border p-2">
                  <div className="flex items-center justify-between text-xs font-semibold">Formation {i + 1}
                    <ItemTools onUp={() => set("education", move(data.education, i, -1))} onDown={() => set("education", move(data.education, i, 1))} onDelete={() => set("education", data.education.filter((_, k) => k !== i))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Début" value={e.start} onChange={(v) => updEdu(i, { start: v })} />
                    <Field label="Fin" value={e.end} onChange={(v) => updEdu(i, { end: v })} />
                  </div>
                  <Field label="Diplôme" value={e.degree} onChange={(v) => updEdu(i, { degree: v })} />
                  <Field label="Établissement" value={e.school} onChange={(v) => updEdu(i, { school: v })} />
                  <Field label="Détails" value={e.description} onChange={(v) => updEdu(i, { description: v })} multi />
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={() => set("education", [...data.education, { start: "", end: "", degree: "", school: "", description: "" }])}><Plus className="h-4 w-4" /> Ajouter une formation</Button>
            </Section>
            <StringList label="Compétences" items={data.skills} onChange={(v) => set("skills", v)} />
            <StringList label="Langues" items={data.languages} onChange={(v) => set("languages", v)} />
            <StringList label="Loisirs" items={data.hobbies} onChange={(v) => set("hobbies", v)} />
          </div>
          <div className="min-w-0 self-start rounded-md border bg-muted p-2">
            <CvPreview html={html} />
          </div>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-3">
        <h1 className="font-serif text-2xl font-bold">CV Studio</h1>
        <p className="mb-3 text-sm text-muted-foreground">100 modèles modernes et 20 classiques, modifiables librement et exportables en Word ou PDF.</p>
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
              <div className="relative overflow-hidden bg-muted">
                <CvPreview compact html={renderCvHtml(t, SAMPLE_CV)} />
                {t.premium && <span className="absolute right-1 top-1 flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground"><Crown className="h-3 w-3" /> Premium</span>}
              </div>
                <div className="p-2">
                <div className="truncate text-xs font-semibold">{t.name}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/60 pt-1">
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <FileText className="h-3 w-3" /> CV {t.category}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">A4</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
