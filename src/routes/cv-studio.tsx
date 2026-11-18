import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle, ChevronLeft, ChevronRight,
  Download, FileText, ImagePlus, Plus, RefreshCw, Save, Sparkles, Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CvPreview } from "@/components/CvPreview";
import {
  CV_TEMPLATES, EMPTY_CV, sampleCvFor, renderCvHtml,
  type CvData, type CvEducation, type CvExperience, type CvTemplate,
} from "@/lib/cv-templates";

export const Route = createFileRoute("/cv-studio")({
  head: () => ({
    meta: [
      { title: "BERSA Writer — Modèles de CV professionnels" },
      { name: "description", content: "Créez et personnalisez votre CV professionnel avec assistant intelligent, rognage photo et exports Word, PDF ou Image." },
      { property: "og:title", content: "BERSA Writer — Modèles de CV" },
      { property: "og:description", content: "Éditeur et modèles de CV avec assistance intelligente, signature et formats conformes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CvStudio,
});

const STORE = "bersa-cv-data-v3";
const SIG_STORE = "bersa-user-signature";
const inputCls = "mt-1 w-full rounded-md border bg-muted p-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none";

const WIZARD_STEPS = [
  { id: 1, label: "Photo & Cadrage" },
  { id: 2, label: "Identité & Profil" },
  { id: 3, label: "Coordonnées" },
  { id: 4, label: "Expériences" },
  { id: 5, label: "Formations" },
  { id: 6, label: "Compétences" },
  { id: 7, label: "Langues" },
  { id: 8, label: "Rubriques +" },
  { id: 9, label: "Signature" },
] as const;

function Field({ label, value, onChange, multi, placeholder }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean; placeholder?: string }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      {multi ? (
        <textarea rows={3} placeholder={placeholder} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input placeholder={placeholder} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  const current = c[i];
  const target = c[j];
  if (current === undefined || target === undefined) return arr;
  c[i] = target;
  c[j] = current;
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

function CvStudio() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState<CvTemplate | null>(null);
  const [data, setData] = useState<CvData>(EMPTY_CV);
  const [step, setStep] = useState<number>(1);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(50);
  const [cropY, setCropY] = useState<number>(50);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORE);
    if (saved) {
      try { setData({ ...EMPTY_CV, ...JSON.parse(saved) }); } catch { /* ignore */ }
    }
    const template = localStorage.getItem(STORE + "-template");
    if (template) {
      setSel(CV_TEMPLATES.find((t) => t.id === template) || null);
    }
    const savedSig = localStorage.getItem(SIG_STORE);
    if (savedSig) {
      setData((d) => ({ ...d, signatureImage: d.signatureImage || savedSig }));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORE, JSON.stringify(data));
        if (sel) localStorage.setItem(STORE + "-template", sel.id);
        if (data.signatureImage) localStorage.setItem(SIG_STORE, data.signatureImage);
      } catch { /* storage limit */ }
    }, 600);
    return () => clearTimeout(timer);
  }, [data, sel, ready]);

  const set = <K extends keyof CvData>(k: K, v: CvData[K]) => setData((d) => ({ ...d, [k]: v }));

  const fileName = (`${data.firstName}_${data.lastName}` || "cv").replace(/[^\w-]+/g, "_");
  const html = sel ? renderCvHtml(sel, data) : "";

  // Calcul du score de qualité (%) du CV
  const qualityScore = useMemo(() => {
    let score = 0;
    if (data.firstName && data.lastName) score += 15;
    if (data.title) score += 10;
    if (data.summary && data.summary.length > 50) score += 15;
    if (data.phone && data.email) score += 15;
    if (data.experiences && data.experiences.length > 0) score += 20;
    if (data.education && data.education.length > 0) score += 15;
    if (data.skills && data.skills.length >= 3) score += 10;
    return Math.min(100, score);
  }, [data]);

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error("Photo trop lourde (4 Mo maximum)."); return; }
    const r = new FileReader();
    r.onload = () => {
      set("photo", String(r.result));
      set("showPhoto", true);
      toast.success("Photo chargée. Ajustez le cadrage ci-dessous.");
    };
    r.readAsDataURL(file);
  };

  const applyManualCrop = async () => {
    const src = data.photo || sel?.defaultPhoto;
    if (!src) return;
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const side = Math.min(img.naturalWidth, img.naturalHeight) / cropZoom;
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, (img.naturalWidth - side) * (cropX / 100), (img.naturalHeight - side) * (cropY / 100), side, side, 0, 0, 600, 600);
      set("photo", canvas.toDataURL("image/jpeg", 0.92));
      toast.success("Cadrage de la photo appliqué.");
    } catch { toast.error("Impossible de rogner cette photo."); }
  };

  const save = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(data));
      if (sel) localStorage.setItem(STORE + "-template", sel.id);
      toast.success("CV enregistré sur cet appareil.");
    } catch { toast.error("Espace insuffisant sur l'appareil."); }
  };

  const exportWord = () => {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:A4;margin:0}body{margin:0}</style></head><body>${html}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + doc], { type: "application/msword" }));
    a.download = `${fileName}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Document Word généré.");
  };

  const exportPdf = async () => {
    if (busy || !previewRef.current) return;
    const paper = previewRef.current.querySelector<HTMLElement>("[data-cv-paper]");
    if (!paper) return;
    setBusy(true);
    const clone = paper.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.position = "fixed";
    clone.style.left = "-10000px";
    clone.style.top = "0";
    document.body.appendChild(clone);
    try {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      await document.fonts.ready;
      await Promise.all(Array.from(clone.querySelectorAll("img")).map((img) => img.decode().catch(() => {})));
      const canvas = await toCanvas(clone, { pixelRatio: 2, width: 794, height: clone.scrollHeight });
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageHeight = Math.round((canvas.width * 297) / 210);
      for (let y = 0; y < canvas.height; y += pageHeight) {
        if (y) pdf.addPage();
        const page = document.createElement("canvas");
        page.width = canvas.width;
        page.height = Math.min(pageHeight, canvas.height - y);
        const ctx = page.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(canvas, 0, y, page.width, page.height, 0, 0, page.width, page.height);
        pdf.addImage(page.toDataURL("image/png"), "PNG", 0, 0, 210, (page.height * 210) / page.width);
      }
      pdf.save(`${fileName}.pdf`);
      toast.success("CV téléchargé en PDF.");
    } catch { toast.error("Échec du téléchargement PDF."); }
    finally { clone.remove(); setBusy(false); }
  };

  const exportImage = async () => {
    if (busy || !previewRef.current) return;
    const paper = previewRef.current.querySelector<HTMLElement>("[data-cv-paper]");
    if (!paper) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      await document.fonts.ready;
      const dataUrl = await toPng(paper, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${fileName}.png`;
      a.click();
      toast.success("Photo du CV téléchargée.");
    } catch { toast.error("Téléchargement de la photo impossible."); }
    finally { setBusy(false); }
  };

  const importCv = async (file?: File) => {
    if (!file) return;
    try {
      if (/\.json$/i.test(file.name)) {
        const imported = JSON.parse(await file.text());
        setData({ ...EMPTY_CV, ...imported });
        toast.success("Données du CV importées.");
      } else {
        const { importDocumentFile } = await import("@/lib/document-import");
        const imported = await importDocumentFile(file);
        const doc = new DOMParser().parseFromString(imported.html, "text/html");
        const text = doc.body.innerText || doc.body.textContent || "";
        set("sections", [...(data.sections || []), { key: crypto.randomUUID(), title: "Contenu importé", content: text }]);
        toast.info("Texte importé dans vos rubriques supplémentaires.");
      }
    } catch { toast.error("Impossible d'importer ce fichier."); }
  };

  const actionsBar = (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2 shadow-xs">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={save}><Save className="h-4 w-4" /> Enregistrer</Button>
        <Button size="sm" variant="outline" onClick={exportWord}><Download className="h-4 w-4" /> Word</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={exportPdf}><Download className="h-4 w-4" />{busy ? "Préparation…" : "PDF"}</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={exportImage}><ImagePlus className="h-4 w-4" /> Photo (PNG)</Button>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-primary" /> Score qualité : <span className="text-foreground">{qualityScore}%</span>
      </div>
    </div>
  );
                                     
