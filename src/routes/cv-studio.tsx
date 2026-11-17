import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Crown, Download, FileText, ImagePlus, Plus, Printer, Save, Trash2, Eye, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CvPersonalization, CvExtraSections } from "@/components/CvPersonalization";
import { CvPreview } from "@/components/CvPreview";
import {
  CV_TEMPLATES, EMPTY_CV, sampleCvFor, renderCvHtml,
  type CvData, type CvEducation, type CvExperience, type CvTemplate,
} from "@/lib/cv-templates";

export const Route = createFileRoute("/cv-studio")({
  head: () => ({
    meta: [
      { title: "BERSA Writer — CV personnalisables" },
      { name: "description", content: "Modèles de CV professionnels : modifiez librement chaque information et exportez en Word ou PDF." },
      { property: "og:title", content: "Modèles de CV BERSA" },
      { property: "og:description", content: "Modèles de CV professionnels, éditables et exportables en Word ou PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CvStudio,
});

const STORE = "bersa-cv-data-v2";
const inputCls = "mt-1 w-full rounded-md border bg-muted p-2 text-sm text-foreground";

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<"all" | "free" | "premium">("all");
  const [sel, setSel] = useState<CvTemplate | null>(null);
  const [data, setData] = useState<CvData>(EMPTY_CV);

  useEffect(() => {
    const saved = localStorage.getItem(STORE);
    if (saved) try { setData({ ...EMPTY_CV, ...JSON.parse(saved) }); } catch { /* ignore */ }
    const template = localStorage.getItem(STORE + "-template");
    if (template) setSel(CV_TEMPLATES.find(t => t.id === template) || null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(data)); if (sel) localStorage.setItem(STORE + "-template", sel.id); } catch { /* explicit save reports storage errors */ } }, 600);
    return () => clearTimeout(timer);
  }, [data, sel, ready]);

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
  const exportPdf = async () => {
    if (busy || !previewRef.current) return;
    const paper = previewRef.current.querySelector<HTMLElement>('[data-cv-paper]');
    if (!paper) return;
    setBusy(true);
    const clone = paper.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none'; clone.style.position = 'fixed'; clone.style.left = '-10000px'; clone.style.top = '0';
    document.body.appendChild(clone);
    try {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
      await document.fonts.ready;
      await Promise.all(Array.from(clone.querySelectorAll('img')).map(img => img.decode().catch(() => {})));
      const canvas = await toCanvas(clone, { pixelRatio: 2, width: 794, height: clone.scrollHeight });
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageHeight = Math.round(canvas.width * 297 / 210);
      for (let y = 0; y < canvas.height; y += pageHeight) {
        if (y) pdf.addPage();
        const page = document.createElement('canvas'); page.width = canvas.width; page.height = Math.min(pageHeight, canvas.height - y);
        const ctx = page.getContext('2d'); if (!ctx) throw new Error('canvas');
        ctx.drawImage(canvas, 0, y, page.width, page.height, 0, 0, page.width, page.height);
        pdf.addImage(page.toDataURL('image/png'), 'PNG', 0, 0, 210, page.height * 210 / page.width);
      }
      pdf.save(`${fileName}.pdf`);
    } catch { toast.error('Téléchargement PDF impossible. Réessayez avec une photo plus légère.'); }
    finally { clone.remove(); setBusy(false); }
  };
  const importCv = async (file?: File) => {
    if (!file) return;
    try {
      if (/\.json$/i.test(file.name)) {
        const imported = JSON.parse(await file.text());
        if (typeof imported.firstName !== 'string' || !Array.isArray(imported.experiences)) throw new Error('format');
        setData({ ...EMPTY_CV, ...imported });
      } else {
        const { importDocumentFile } = await import('@/lib/document-import');
        const imported = await importDocumentFile(file);
        const doc = new DOMParser().parseFromString(imported.html, 'text/html');
        const text = doc.body.innerText || doc.body.textContent || '';
        set('sections', [...(data.sections || []), { key: crypto.randomUUID(), title: 'CV importé', content: text }]);
        toast.info('Texte importé dans une rubrique modifiable ; les champs restent à répartir.');
      }
    } catch { toast.error('Impossible d’importer ce CV. Choisissez un document Word, PDF texte ou une sauvegarde BERSA.'); }
  };
  const actions = <div className="flex flex-wrap gap-2 py-2" aria-label="Enregistrer et télécharger le CV">
    <Button size="sm" variant="outline" onClick={save}><Save className="h-4 w-4" /> Enregistrer</Button>
    <Button size="sm" variant="outline" onClick={exportWord}><Download className="h-4 w-4" /> Word</Button>
    <Button size="sm" disabled={busy} onClick={exportPdf}><Download className="h-4 w-4" />{busy ? 'Préparation…' : 'Télécharger PDF'}</Button>
  </div>;

  const updExp = (i: number, patch: Partial<CvExperience>) => set("experiences", data.experiences.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const updEdu = (i: number, patch: Partial<CvEducation>) => set("education", data.education.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  if (sel) return (
    <AppShell>
      <div className="mx-auto max-w-6xl p-3 pb-24">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSel(null)}><ArrowLeft className="h-4 w-4" /> Modèles</Button>
          <h1 className="font-serif text-xl font-bold">BERSA Writer</h1>
          <Button className="ml-auto" size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="h-4 w-4" />Aperçu</Button>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><FileText className="h-4 w-4" />Importer un CV</Button><Button size="sm" variant="outline" onClick={() => importRef.current?.click()}>Importer LinkedIn (PDF)</Button><input ref={importRef} type="file" accept=".docx,.doc,.pdf,.txt,.json" className="hidden" onChange={e => { void importCv(e.target.files?.[0]); e.target.value = ''; }} /></div>
            <CvPersonalization data={data} template={sel} onChange={patch => setData(d => ({ ...d, ...patch }))} />
                        <Section title="Photo et identité">
              <div className="flex items-center gap-3">
                {data.photo || sel?.defaultPhoto ? (
                  <img
                    src={data.photo || sel?.defaultPhoto}
                    alt="Photo du CV"
                    className="h-16 w-16 rounded-lg object-cover border border-border shadow-xs"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90">
                    <ImagePlus className="h-3.5 w-3.5" /> Insérer ma photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input type="checkbox" checked={data.showPhoto} onChange={(e) => set("showPhoto", e.target.checked)} />
                    Afficher la photo sur le CV
                  </label>
                  {data.photo && (
                    <button type="button" className="text-xs text-destructive hover:underline" onClick={() => set("photo", "")}>
                      Rétablir la photo du modèle
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Prénom" value={data.firstName} onChange={(v) => set("firstName", v)} />
                <Field label="Nom" value={data.lastName} onChange={(v) => set("lastName", v)} />
              </div>
              <Field label="Métier / poste visé" value={data.title} onChange={(v) => set("title", v)} />
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={data.titleAsHeading !== false} onChange={e => set('titleAsHeading', e.target.checked)} />Afficher le poste recherché</label>
              <Field label="Profil (à propos de moi)" value={data.summary} onChange={(v) => set("summary", v)} multi />
              <Button size="sm" variant="outline" onClick={() => { if (!data.title.trim() || !data.skills.some(s => s.trim())) { toast.info('Renseignez votre poste et vos compétences pour une suggestion.'); return; } set('summary', `${data.title.trim()}, je souhaite mettre mes compétences en ${data.skills.filter(s => s.trim()).join(', ')} au service de votre équipe.`); }}><Sparkles className="h-4 w-4" />Suggestion de profil</Button>
            </Section>
            <Section title="Coordonnées">
              <div className="grid grid-cols-2 gap-2"><Field label="Ville" value={data.city || ''} onChange={v => set('city', v)} /><Field label="Commune" value={data.commune || ''} onChange={v => set('commune', v)} /></div>
              <Field label="Code postal (facultatif)" value={data.postalCode || ''} onChange={v => set('postalCode', v)} />
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
                // Vue Catalogue : Modèle grand format mis en avant avec bouton + et défilement
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-3 pb-24">
        <div className="mb-4 text-center">
          <h1 className="font-serif text-2xl font-bold">Modèles de CV</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Chaque modèle est entièrement rempli et prêt à l'emploi. Choisissez un modèle pour le personnaliser.
          </p>
        </div>

        {/* Modèle mis en avant (premier modèle Sarah Garcia) */}
        {list[0] && (
          <div className="mb-8 rounded-xl border bg-card p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-sm">{list[0].name} (Recommandé)</span>
              <Button size="lg" className="gap-2 bg-primary px-6 font-bold shadow-md" onClick={() => setSel(list[0])}>
                <Plus className="h-5 w-5" /> Créer ce CV
              </Button>
            </div>
            
            {/* Aperçu complet du modèle */}
            <div className="overflow-hidden rounded-lg border bg-muted shadow-inner">
              <CvPreview compact={false} html={renderCvHtml(list[0], sampleCvFor(list[0]))} />
            </div>

            <div className="mt-4 flex flex-col items-center gap-2">
              <Button size="lg" className="w-full max-w-md gap-2 text-base font-bold shadow-md" onClick={() => setSel(list[0])}>
                <Plus className="h-6 w-6" /> Choisir ce modèle (+ Créer un nouveau CV)
              </Button>
              <p className="text-xs text-muted-foreground">Ou défilez vers le bas pour découvrir les autres modèles ↓</p>
            </div>
          </div>
        )}

        {/* Défilement vertical des autres modèles */}
        <div className="space-y-6">
          <h2 className="font-serif text-lg font-bold">Autres modèles disponibles</h2>
          {list.slice(1).map((t) => (
            <div key={t.id} className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-sm">{t.name}</span>
                <Button size="sm" onClick={() => setSel(t)} className="gap-1">
                  <Plus className="h-4 w-4" /> Utiliser ce modèle
                </Button>
              </div>
              <div className="overflow-hidden rounded border bg-muted">
                <CvPreview compact html={renderCvHtml(t, sampleCvFor(t))} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
            
