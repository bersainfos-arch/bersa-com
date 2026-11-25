import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, CheckCircle, ChevronLeft, ChevronRight,
  Download, FileText, ImagePlus, Lock, Plus, RefreshCw, Save, Sparkles, Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CvPreview } from "@/components/CvPreview";
import {
  CV_TEMPLATES, EMPTY_CV, sampleCvFor, renderCvHtml,
  type CvData, type CvEducation, type CvExperience, type CvTemplate,
} from "@/lib/cv-templates";
import { saveDeviceFile } from "@/lib/device-save";
import { canFinalizeCv, cvStepError } from "@/lib/cv-wizard";
import { BackGlyph } from "@/components/BackGlyph";
import { cvSaveAllowed, CV_FREE_KEY } from "@/lib/cv-quota";
import { supabase } from "@/integrations/supabase/client";

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
const inputCls = "mt-1 w-full rounded-md border bg-background px-3 py-3.5 text-base text-foreground focus:ring-2 focus:ring-primary focus:outline-none";

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

const DEMO_VALUES = new Set<string>();
function collectDemoStrings(obj: unknown) {
  if (!obj) return;
  if (typeof obj === "string") {
    const s = obj.trim();
    if (s.length > 0) DEMO_VALUES.add(s);
  } else if (Array.isArray(obj)) {
    obj.forEach(collectDemoStrings);
  } else if (typeof obj === "object") {
    Object.values(obj).forEach(collectDemoStrings);
  }
}
CV_TEMPLATES.forEach((t) => collectDemoStrings(sampleCvFor(t)));

function Field({ label, value, onChange, multi, placeholder }: { label: string; value: string; onChange: (v: string) => void; multi?: boolean; placeholder?: string }) {
  const isDemo = Boolean(value && DEMO_VALUES.has(value.trim()));
  const onFocus = () => {
    if (isDemo) onChange("");
  };
  return (
    <label className="block text-base font-medium text-foreground">
      {label}
      {multi ? (
        <textarea
          rows={4}
          placeholder={placeholder || (isDemo ? value : "")}
          className={inputCls}
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          placeholder={placeholder || (isDemo ? value : "")}
          className={inputCls}
          value={value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
        />
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
  const [furthestStep, setFurthestStep] = useState(1);
  const [finalized, setFinalized] = useState(false);
  const nextStep = () => {
    const error = cvStepError(data, step);
    if (error) { toast.error(error); return; }
    if (step === WIZARD_STEPS.length) {
      if (!canFinalizeCv(data, furthestStep)) { toast.error("Complétez votre identité et vos coordonnées."); return; }
      setFinalized(true);
      save();
      return;
    }
    setStep(step + 1);
    setFurthestStep(previous => Math.max(previous, step + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
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
      /* Saved data remains available when its model is selected. */
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
  const [cvScale, setCvScale] = useState(1);
  const [pinch, setPinch] = useState(1);
  const pinchStart = useRef<{ d: number; z: number } | null>(null);
  const [bright, setBright] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [bgWhite, setBgWhite] = useState(false);
  const [filterBw, setFilterBw] = useState(false); 
  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [extraKey, setExtraKey] = useState("");

  const [payWall, setPayWall] = useState(false);
  const saveBlob = async (blob: Blob, name: string, _ext: string, _description: string) => {
    const cvId = `${data.firstName}|${data.lastName}`.trim().toLowerCase();
    const owner = localStorage.getItem(CV_FREE_KEY);
    if (!cvSaveAllowed(owner, cvId, false)) {
      const { data: sub } = await supabase.from("subscriptions").select("id").eq("status", "active").gt("expires_at", new Date().toISOString()).limit(1);
      if (!sub?.length) { setPayWall(true); return; }
    }
    if (!owner) localStorage.setItem(CV_FREE_KEY, cvId);
    const result = await saveDeviceFile(blob, name);
    if (result === "saved") toast.success("CV enregistré dans le dossier choisi.");
    if (result === "shared") toast.info("Fichier transmis au menu de votre appareil.");
    if (result === "downloaded") toast.success("CV téléchargé.");
  };

  const auditSteps = [
    { label: "Prénom et nom", ok: Boolean(data.firstName.trim() && data.lastName.trim()), step: 2 },
    { label: "Métier / poste visé", ok: Boolean(data.title.trim()), step: 2 },
    { label: "Profil de plus de 150 caractères", ok: data.summary.trim().length >= 150, step: 2 },
    { label: "Téléphone et e-mail", ok: Boolean(data.phone.trim() && data.email.trim()), step: 3 },
    { label: "Ville et adresse", ok: Boolean((data.city || "").trim() && data.address.trim()), step: 3 },
    { label: "Au moins une expérience avec missions", ok: data.experiences.some((e) => e.role.trim() && e.description.trim().length > 20), step: 4 },
    { label: "Au moins une formation", ok: data.education.some((e) => e.degree.trim()), step: 5 },
    { label: "Au moins 4 compétences", ok: data.skills.filter((x) => x.trim()).length >= 4, step: 6 },
    { label: "Au moins 2 langues avec niveau", ok: (data.languageItems || []).filter((l) => l.name.trim()).length >= 2 || data.languages.length >= 2, step: 7 },
    { label: "Signature", ok: Boolean(data.signature?.trim() || data.signatureImage), step: 9 },
  ];
  const [showAudit, setShowAudit] = useState(false);
  
  const onPreviewTap = (e: React.MouseEvent) => {
  const target = e.target as HTMLElement;
    // Si l'utilisateur touche la photo directement sur le CV affiché
    if (target.tagName === "IMG" || target.closest("img")) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const text = (target.textContent || "").trim();
    if (!text) return;
    const has = (v?: string) => Boolean(v && v.trim() && (v.includes(text) || text.includes(v.trim())));
    if (has(data.firstName) || has(data.lastName) || has(data.title) || has(data.summary)) setStep(2);
    else if (data.experiences.some((x) => has(x.role) || has(x.company) || has(x.description))) setStep(4);
    else if (data.education.some((x) => has(x.degree) || has(x.school) || has(x.grade))) setStep(5);
    else if (data.skills.some(has)) setStep(6);
    else if ((data.languageItems || []).some((l) => has(l.name)) || data.languages.some(has)) setStep(7);
    else if ((data.sections || []).some((x) => has(x.title) || has(x.content))) setStep(8);
    else if ([data.phone, data.email, data.address, data.city, data.commune, data.birth, data.license, data.website, data.birthPlace, data.gender, data.nationality, data.civilStatus].some(has)) setStep(3);
    else return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const improveText = (v: string, kind: "profil" | "mission") => {
    const clean = v.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!clean.length) return v;
    const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
    if (kind === "mission") return clean.map((l) => `- ${cap(l.replace(/^[-•]\s*/, "").replace(/\.$/, ""))}.`).join("\n");
    const t = clean.join(" ").replace(/\s+/g, " ").replace(/\bje suis\b/gi, "Je suis").trim();
    const ending = data.title ? ` Je souhaite mettre ces atouts au service d'un poste de ${data.title.toLowerCase()}.` : "";
    return cap(t.endsWith(".") ? t : t + ".") + (t.includes("souhaite mettre") ? "" : ending);
  };

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
      ctx.filter = `brightness(${bright}%) contrast(${contrast}%)${filterBw ? " grayscale(100%)" : ""}`;
      ctx.drawImage(img, (img.naturalWidth - side) * (cropX / 100), (img.naturalHeight - side) * (cropY / 100), side, side, 0, 0, 600, 600);
      ctx.filter = "none";
      if (bgWhite) {
        const px = ctx.getImageData(0, 0, 600, 600);
        for (let i = 0; i < px.data.length; i += 4) {
          const r = px.data[i]!, g = px.data[i + 1]!, b = px.data[i + 2]!;
          if (r > 185 && g > 185 && b > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 30) { px.data[i] = 255; px.data[i + 1] = 255; px.data[i + 2] = 255; }
        }
        ctx.putImageData(px, 0, 0);
      }
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

  // Téléchargement direct sans pop-up bloquante
  const directDownloadBlob = (blob: Blob, name: string) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(`${name} téléchargé avec succès !`);
    } catch {
      toast.error("Échec du téléchargement. Vérifiez les autorisations de votre navigateur.");
    }
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
      
  type SaveKind = "pdf" | "docx" | "png";
  const SAVE_FORMATS: { kind: SaveKind; label: string; hint: string; mime: string; description: string }[] = [
    { kind: "pdf", label: "PDF", hint: "Une seule page A4, idéal pour postuler", mime: "application/pdf", description: "Document PDF" },
    { kind: "docx", label: "Word (.docx)", hint: "S’ouvre dans Word et WPS", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", description: "Document Word" },
    { kind: "png", label: "Photo (PNG)", hint: "Image haute qualité à partager", mime: "image/png", description: "Image PNG" },
  ];
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveKind, setSaveKind] = useState<SaveKind>("pdf");
  const [savedFile, setSavedFile] = useState<{ kind: SaveKind; blob: Blob } | null>(null);

  // Prepare the file as soon as a format is chosen, so the folder picker opens instantly on the next tap
  // (browsers only allow the picker/share sheet directly inside a tap).
  const prepareFormat = async (kind: SaveKind) => {
    setSaveKind(kind);
    setSavedFile(null);
    const paper = previewRef.current?.querySelector<HTMLElement>("[data-cv-paper]");
    if (!paper) { toast.error("Aperçu du CV non disponible."); return; }
    setBusy(true);
    try {
      const { renderCvPage, cvPdfBlob, cvDocxBlob, cvPngBlob } = await import("@/lib/cv-export");
      const page = await renderCvPage(paper, 3);
      const blob = kind === "pdf" ? await cvPdfBlob(page) : kind === "docx" ? await cvDocxBlob(page) : await cvPngBlob(page);
      setSavedFile({ kind, blob });
    } catch {
      toast.error("Impossible de préparer le fichier. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const openSaveDialog = () => {
    save();
    setSaveOpen(true);
    void prepareFormat(saveKind);
  };

  const saveToFolder = async () => {
    if (!savedFile) return;
    const f = SAVE_FORMATS.find((x) => x.kind === savedFile.kind);
    if (!f) return;
    await saveBlob(savedFile.blob, `${fileName}.${savedFile.kind}`, savedFile.kind, f.description);
    setSaveOpen(false);
  };
  const saveDirect = () => {
    if (!savedFile) return;
    directDownloadBlob(savedFile.blob, `${fileName}.${savedFile.kind}`);
    setSaveOpen(false);
  };

  const actionsBar = (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2 shadow-xs">
      <Button size="sm" className="bg-primary text-primary-foreground font-semibold" disabled={busy && !saveOpen} onClick={openSaveDialog}>
        <Save className="h-4 w-4" /> Enregistrer le CV
      </Button>
      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-primary" /> Score qualité : <span className="text-foreground">{qualityScore}%</span>
      </div>
    </div>
  );

  const saveDialog = (
    <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Enregistrer votre CV</DialogTitle>
          <DialogDescription>1. Choisissez le format. 2. Choisissez le dossier de votre téléphone ou ordinateur.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2" role="radiogroup" aria-label="Format du fichier">
          {SAVE_FORMATS.map((f) => (
            <button
              key={f.kind}
              type="button"
              role="radio"
              aria-checked={saveKind === f.kind}
              disabled={busy}
              onClick={() => void prepareFormat(f.kind)}
              className={`flex w-full min-w-0 items-center gap-3 rounded-lg border p-3 text-left transition ${saveKind === f.kind ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
            >
              {f.kind === "png" ? <ImagePlus className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
              <span className="flex-1">
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="block text-xs text-muted-foreground">{f.hint}</span>
              </span>
              <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${saveKind === f.kind ? "border-primary bg-primary" : "border-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {busy ? "Préparation du fichier…" : savedFile ? `Fichier prêt : ${fileName}.${savedFile.kind}` : ""}
        </p>
        <div className="grid gap-2">
          <Button disabled={!savedFile || busy} onClick={() => void saveToFolder()}>
            <Download className="h-4 w-4" /> Choisir le dossier et enregistrer
          </Button>
          <Button variant="outline" disabled={!savedFile || busy} onClick={saveDirect}>
            Téléchargement direct
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const paywallDialog = (
    <Dialog open={payWall} onOpenChange={setPayWall}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md overflow-hidden p-5 sm:p-6 text-center">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold">Abonnement Standard requis</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            L'enregistrement de votre premier CV est 100 % gratuit. Pour enrichir et enregistrer un autre CV dans plusieurs formats, veuillez souscrire à l'<strong>Abonnement Standard</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            className="w-full bg-primary text-primary-foreground font-semibold"
            onClick={() => {
              setPayWall(false);
              window.location.href = "/abonnements";
            }}
          >
            Découvrir l'Abonnement Standard
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setPayWall(false)}>
            Continuer l'édition
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const selectModel = (t: CvTemplate) => {
    setSel(t);
    const demo = sampleCvFor(t);
    setData((curr) => {
      // Si l'utilisateur n'a pas encore saisi de prénom, on remplit avec le profil dense démo
      // Profil vide ou profil de démonstration : on charge les données propres à ce modèle
      if (!curr.firstName.trim() || DEMO_VALUES.has(curr.firstName.trim())) return { ...EMPTY_CV, photo: curr.photo, showPhoto: demo.showPhoto };
      return curr;
    });
    setStep(1);
    setFurthestStep(1);
    setFinalized(false);
    toast.success(`Modèle ${t.name} sélectionné.`);
  };

  const updExp = (i: number, patch: Partial<CvExperience>) =>
    set("experiences", data.experiences.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const updEdu = (i: number, patch: Partial<CvEducation>) =>
    set("education", data.education.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  // Vue Éditeur pas-à-pas lorsque sel != null
  if (sel) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl p-3 pb-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setSel(null)}>
              <BackGlyph className="h-4 w-4" /> Retour aux modèles
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold">BERSA Writer</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{sel.name}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => importRef.current?.click()}>
              <FileText className="h-4 w-4" /> Importer un CV
            </Button>
            <input ref={importRef} type="file" accept=".docx,.doc,.pdf,.txt,.json" className="hidden" onChange={(e) => { void importCv(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          {/* Stepper de navigation par rubriques */}
          <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {WIZARD_STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={s.id > furthestStep}
                onClick={() => { setStep(s.id); setFinalized(false); }}
                className={`flex-shrink-0 rounded-md px-2.5 py-1 font-medium transition ${
                  step === s.id ? "bg-primary text-primary-foreground shadow-xs" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s.id}. {s.label}
              </button>
            ))}
          </div>

          <div className={`grid min-w-0 gap-4 ${finalized ? "lg:grid-cols-[400px_1fr]" : "max-w-lg mx-auto"}`}>
            {/* Colonne Formulaire Rubrique par Rubrique */}
            <div className="min-w-0 space-y-3">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b pb-2">
                  <h2 className="font-semibold text-lg">{WIZARD_STEPS[step - 1]?.label}</h2>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={step >= WIZARD_STEPS.length} onClick={nextStep}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Étape 1 : Photo & Cadrage */}
                {step === 1 && (
                  <div className="space-y-3">
                  <div className="flex items-center gap-3">
                      {/* Photo cliquable directement pour importer/changer */}
                      <label
                        className="group relative block cursor-pointer shrink-0"
                        title="Touchez la photo pour la changer ou en ajouter une nouvelle"
                      >
                        <img
                          src={data.photo || sel.defaultPhoto || "/cv-photos/photo-1.png"}
                          alt="Photo du CV"
                          className={`h-20 w-20 object-cover border shadow-xs transition group-hover:opacity-85 ${
                            data.photoShape === "circle"
                              ? "rounded-full"
                              : data.photoShape === "rounded"
                              ? "rounded-xl"
                              : "rounded-none"
                          }`}
                        />
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100 ${
                            data.photoShape === "circle"
                              ? "rounded-full"
                              : data.photoShape === "rounded"
                              ? "rounded-xl"
                              : ""
                          }`}
                        >
                          <ImagePlus className="h-4 w-4" />
                          <span className="text-[10px] font-bold">Changer</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onPhoto(e.target.files?.[0])}
                        />
                      </label>

                      <div className="space-y-1.5">
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90">
                          <ImagePlus className="h-3.5 w-3.5" /> Changer la photo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
                        </label>
                        {(data.photo || data.showPhoto) && (
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive" onClick={() => { set("photo", ""); set("showPhoto", false); toast.info("Photo effacée du CV."); }}>
                            <Trash2 className="h-3.5 w-3.5" /> Effacer la photo
                          </Button>
                        )}
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input type="checkbox" checked={data.showPhoto} onChange={(e) => set("showPhoto", e.target.checked)} />
                          Afficher la photo sur le CV
                        </label>
                      </div>
                    </div>

                    <div className="border-t pt-2 space-y-2">
                      <div className="text-xs font-semibold">Rognage manuel : glissez la photo avec le doigt, pincez ou utilisez le zoom</div>
                      <div
                        className={`relative mx-auto h-56 w-56 touch-none overflow-hidden border-2 border-primary bg-muted ${data.photoShape === "circle" ? "rounded-full" : data.photoShape === "rounded" ? "rounded-2xl" : ""}`}
                        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); dragRef.current = { x: e.clientX, y: e.clientY, cx: cropX, cy: cropY }; }}
                        onPointerMove={(e) => { const d = dragRef.current; if (!d) return; setCropX(Math.max(0, Math.min(100, d.cx - (e.clientX - d.x) / 2))); setCropY(Math.max(0, Math.min(100, d.cy - (e.clientY - d.y) / 2))); }}
                        onPointerUp={() => { dragRef.current = null; }}
                        onWheel={(e) => setCropZoom((z) => Math.max(1, Math.min(4, z - e.deltaY / 500)))}
                      >
                        <img src={data.photo || sel.defaultPhoto || "/cv-photos/photo-1.png"} alt="Cadrage" draggable={false} className="pointer-events-none h-full w-full select-none object-cover" style={{ objectPosition: `${cropX}% ${cropY}%`, transform: `scale(${cropZoom})`, transformOrigin: `${cropX}% ${cropY}%`, filter: `brightness(${bright}%) contrast(${contrast}%)` }} />
                      </div>
                      <div className="text-xs font-semibold pt-1">Retouche de la photo & qualité</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <label>Luminosité {bright}%<input type="range" min={60} max={150} value={bright} onChange={(e) => setBright(Number(e.target.value))} className="w-full" /></label>
                        <label>Contraste / netteté {contrast}%<input type="range" min={60} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" /></label>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input type="checkbox" checked={bgWhite} onChange={(e) => setBgWhite(e.target.checked)} /> Éclaircir le fond (fonds clairs → blanc)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input type="checkbox" checked={filterBw} onChange={(e) => setFilterBw(e.target.checked)} /> Noir & Blanc professionnel
                        </label>
                      </div>
                      <div className="text-xs font-semibold">Forme de la photo</div>
                      <div className="flex gap-1">
                        {(["circle", "rounded", "square"] as const).map((sh) => (
                          <Button key={sh} size="sm" variant={data.photoShape === sh ? "default" : "outline"} onClick={() => set("photoShape", sh)}>
                            {sh === "circle" ? "Cercle" : sh === "rounded" ? "Arrondi" : "Carré"}
                          </Button>
                        ))}
                      </div>
                      <div className="text-xs font-semibold pt-1">Rognage & Cadrage manuel</div>
                      <label className="block text-xs text-muted-foreground">Zoom photo : {cropZoom.toFixed(1)}x
                        <input type="range" min={1} max={3} step={0.1} value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="w-full" />
                      </label>
                      <label className="block text-xs text-muted-foreground">Position horizontale
                        <input type="range" min={0} max={100} value={cropX} onChange={(e) => setCropX(Number(e.target.value))} className="w-full" />
                      </label>
                      <label className="block text-xs text-muted-foreground">Position verticale
                        <input type="range" min={0} max={100} value={cropY} onChange={(e) => setCropY(Number(e.target.value))} className="w-full" />
                      </label>
                      <Button size="sm" variant="secondary" className="w-full" onClick={applyManualCrop}>Appliquer le cadrage</Button>
                    </div>
                  </div>
                )}

                {/* Étape 2 : Identité & Profil */}
                {step === 2 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Prénom" value={data.firstName} onChange={(v) => set("firstName", v)} placeholder="Ex: Sarah" />
                      <Field label="Nom de famille" value={data.lastName} onChange={(v) => set("lastName", v)} placeholder="Ex: GARCIA" />
                    </div>
                    <Field label="Métier / Poste visé" value={data.title} onChange={(v) => set("title", v)} placeholder="Ex: Responsable Ressources Humaines" />
                    <Field label="Profil (À propos de moi)" value={data.summary} onChange={(v) => set("summary", v)} multi placeholder="Décrivez vos compétences clés et votre parcours..." />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-primary"
                      onClick={() => {
                        if (!data.summary.trim()) { toast.info("Écrivez d'abord quelques mots sur votre profil."); return; }
                        const enhanced = data.summary.replace(/je suis/gi, "Professionnel(le)").replace(/j'aime/gi, "Passionné(e) par").trim();
                        set("summary", `${enhanced} Rigoureux(se), orienté(e) résultats et doté(e) d'un excellent esprit d'équipe.`);
                        toast.success("Profil valorisé par l'assistant intelligent.");
                      }}
                    >
                      <Sparkles className="h-4 w-4" /> Améliorer le profil avec IA
                    </Button>
                  </div>
                )}

                {/* Étape 3 : Coordonnées */}
                {step === 3 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Ville ou pays" value={data.city || ""} onChange={(v) => set("city", v)} placeholder="Ex: Kinshasa, RDC" />
                      <Field label="Commune" value={data.commune || ""} onChange={(v) => set("commune", v)} placeholder="Ex: Gombe" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Code postal (facultatif)" value={data.postalCode || ""} onChange={(v) => set("postalCode", v)} placeholder="Ex: 1001" />
                      <Field label="Adresse physique" value={data.address} onChange={(v) => set("address", v)} placeholder="Ex: 14 Av. de la Paix" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="E-mail" value={data.email} onChange={(v) => set("email", v)} placeholder="nom@exemple.com" />
                      <Field label="Téléphone" value={data.phone} onChange={(v) => set("phone", v)} placeholder="+243..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Date de naissance" value={data.birth} onChange={(v) => set("birth", v)} placeholder="JJ/MM/AAAA" />
                      <Field label="Permis (facultatif)" value={data.license} onChange={(v) => set("license", v)} placeholder="Ex: Permis B" />
                    </div>
                    <Field label="Site web / LinkedIn (facultatif)" value={data.website} onChange={(v) => set("website", v)} placeholder="linkedin.com/in/votre-nom" />

                    <div className="border-t pt-2">
                      <div className="text-xs font-semibold mb-1.5">Ajouter d'autres coordonnées :</div>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { label: "+ Lieu de naissance", key: "birthPlace" },
                          { label: "+ Sexe", key: "gender" },
                          { label: "+ Nationalité", key: "nationality" },
                          { label: "+ État civil", key: "civilStatus" },
                        ].map((btn) => (
                          <Button
                            key={btn.key}
                            size="sm"
                            variant="outline"
                            onClick={() => { if (data[btn.key as keyof CvData] === undefined) set(btn.key as keyof CvData, "" as never); }}
                          >
                            {btn.label}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExtraKey(extraKey ? "" : " ")}
                        >
                          + Champ personnalisé
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {data.birthPlace !== undefined && <Field label="Lieu de naissance" value={data.birthPlace} onChange={(v) => set("birthPlace", v)} placeholder="Ex : Kinshasa" />}
                        {data.gender !== undefined && <label className="block text-base font-medium text-foreground">Sexe<select className={inputCls} value={data.gender} onChange={(e) => set("gender", e.target.value)}><option value="">—</option><option>Masculin</option><option>Féminin</option></select></label>}
                        {data.nationality !== undefined && <Field label="Nationalité" value={data.nationality} onChange={(v) => set("nationality", v)} placeholder="Ex : Congolaise" />}
                        {data.civilStatus !== undefined && <label className="block text-base font-medium text-foreground">État civil<select className={inputCls} value={data.civilStatus} onChange={(e) => set("civilStatus", e.target.value)}><option value="">—</option><option>Célibataire</option><option>Marié(e)</option><option>Divorcé(e)</option><option>Veuf / Veuve</option><option>Union libre</option></select></label>}
                        {Object.entries(data.extra || {}).map(([k, v]) => (
                          <div key={k} className="flex items-end gap-1">
                            <div className="flex-1"><Field label={k} value={v} onChange={(nv) => set("extra", { ...(data.extra || {}), [k]: nv })} /></div>
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" aria-label={`Supprimer ${k}`} onClick={() => { const n = { ...(data.extra || {}) }; delete n[k]; set("extra", n); }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                         {extraKey && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border bg-muted/40 p-2.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Titre du champ (ex : WhatsApp, Skype)
                            <input autoFocus className={inputCls} placeholder="Ex: WhatsApp" value={extraKey.trim()} onChange={(e) => setExtraKey(e.target.value || " ")} />
                          </label>
                          <div className="flex items-end gap-2">
                            <Button size="sm" className="w-full bg-primary" onClick={() => { const k = extraKey.trim(); if (!k) return; set("extra", { ...(data.extra || {}), [k]: "" }); setExtraKey(""); }}>
                              + Insérer dans le CV
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
          
                      
                {/* Étape 4 : Expériences */}
                {step === 4 && (
                  <div className="space-y-3">
                    {data.experiences.map((e, i) => (
                      <div key={i} className="space-y-1.5 rounded-lg border p-2.5 bg-muted/30">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Expérience {i + 1}</span>
                          <ItemTools
                            onUp={() => set("experiences", move(data.experiences, i, -1))}
                            onDown={() => set("experiences", move(data.experiences, i, 1))}
                            onDelete={() => set("experiences", data.experiences.filter((_, k) => k !== i))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Année de début" value={e.start} onChange={(v) => updExp(i, { start: v })} placeholder="AAAA" />
                          <Field label="Année de fin" value={e.end} onChange={(v) => updExp(i, { end: v })} placeholder="AAAA ou En cours" />
                        </div>
                        <Field label="Poste occupé" value={e.role} onChange={(v) => updExp(i, { role: v })} placeholder="Ex: Comptable Principal" />
                        <Field label="Entreprise ou organisation" value={e.company} onChange={(v) => updExp(i, { company: v })} placeholder="Ex: Société Générale" />
                        <Field label="Missions (commencez par « - » pour une puce)" value={e.description} onChange={(v) => updExp(i, { description: v })} multi />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs text-primary gap-1"
                          onClick={() => {
                            const lines = e.description.split("\n").filter(Boolean);
                            const enhanced = lines.map((l) => (l.startsWith("-") ? l : `- ${l}`)).join("\n");
                            updExp(i, { description: enhanced || "- Gestion des opérations clés\n- Optimisation des processus et reporting" });
                            toast.success("Missions structurées en puces d'action.");
                          }}
                        >
                          <Sparkles className="h-3 w-3" /> Améliorer la mission avec IA
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() => set("experiences", [...data.experiences, { start: "", end: "En cours", role: "", company: "", description: "- " }])}
                    >
                      <Plus className="h-4 w-4" /> Ajouter une expérience
                    </Button>
                  </div>
                )}

                {/* Étape 5 : Formations */}
                {step === 5 && (
                  <div className="space-y-3">
                    {data.education.map((e, i) => (
                      <div key={i} className="space-y-1.5 rounded-lg border p-2.5 bg-muted/30">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Formation {i + 1}</span>
                          <ItemTools
                            onUp={() => set("education", move(data.education, i, -1))}
                            onDown={() => set("education", move(data.education, i, 1))}
                            onDelete={() => set("education", data.education.filter((_, k) => k !== i))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Début" value={e.start} onChange={(v) => updEdu(i, { start: v })} placeholder="AAAA" />
                          <Field label="Fin ou en cours" value={e.end} onChange={(v) => updEdu(i, { end: v })} placeholder="AAAA" />
                        </div>
                        <Field label="Diplôme obtenu" value={e.degree} onChange={(v) => updEdu(i, { degree: v })} placeholder="Ex: Licence en Gestion" />
                        <Field label="Établissement ou Institution" value={e.school} onChange={(v) => updEdu(i, { school: v })} placeholder="Ex: Université de Kinshasa" />
                        <Field label="Mention ou pourcentage obtenu" value={e.grade || ""} onChange={(v) => updEdu(i, { grade: v })} placeholder="Ex: Distinction (74%)" />
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() => set("education", [...data.education, { start: "", end: "", degree: "", school: "", grade: "", description: "" }])}
                    >
                      <Plus className="h-4 w-4" /> Ajouter une formation
                    </Button>
                  </div>
                )}

                {/* Étape 6 : Compétences */}
                {step === 6 && (
                  <div className="space-y-2">
                    {data.skills.map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                          <input
                          className={inputCls + " mt-0"}
                          value={s}
                          onFocus={() => {
                            if (s && DEMO_VALUES.has(s.trim())) {
                              set("skills", data.skills.map((x, k) => (k === i ? "" : x)));
                            }
                          }}
                          onChange={(e) => set("skills", data.skills.map((x, k) => (k === i ? e.target.value : x)))}
                          placeholder={s && DEMO_VALUES.has(s.trim()) ? s : "Compétence..."}
                        />
                        <ItemTools
                          onUp={() => set("skills", move(data.skills, i, -1))}
                          onDown={() => set("skills", move(data.skills, i, 1))}
                          onDelete={() => set("skills", data.skills.filter((_, k) => k !== i))}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button type="button" size="sm" variant="outline" className="flex-1 gap-1" onClick={() => set("skills", [...data.skills, ""])}>
                        <Plus className="h-4 w-4" /> Ajouter une compétence
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-primary gap-1"
                        onClick={() => {
                          const suggestions = ["Sens de l'organisation", "Rigueur professionnelle", "Esprit d'analyse", "Travail en équipe"];
                          set("skills", Array.from(new Set([...data.skills, ...suggestions])));
                          toast.success("Compétences enrichies avec l'IA.");
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Suggestions IA
                      </Button>
                    </div>
                  </div>
                )}

                {/* Étape 7 : Langues */}
                {step === 7 && (
                  <div className="space-y-2.5">
                    {(data.languageItems || []).map((li, i) => (
                      <div key={i} className="rounded-md border p-2 bg-muted/20 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Langue {i + 1}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => set("languageItems", (data.languageItems || []).filter((_, k) => k !== i))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                                                    <input
                            className={inputCls + " mt-0"}
                            value={li.name}
                            onFocus={() => {
                              if (li.name && DEMO_VALUES.has(li.name.trim())) {
                                set("languageItems", (data.languageItems || []).map((x, k) => (k === i ? { ...x, name: "" } : x)));
                              }
                            }}
                            placeholder={li.name && DEMO_VALUES.has(li.name.trim()) ? li.name : "Nom de la langue"}
                            onChange={(e) => set("languageItems", (data.languageItems || []).map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))}
                          />
                          <select
                            className={inputCls + " mt-0"}
                            value={li.level}
                            onChange={(e) => {
                              const lvl = e.target.value;
                              const pctMap: Record<string, number> = {
                                "Langue maternelle": 100,
                                "Bilingue": 95,
                                "Excellent / C2": 90,
                                "Avancé / C1": 80,
                                "Intermédiaire élevé / B2": 70,
                                "Intermédiaire / B1": 60,
                                "Élémentaire / A2": 45,
                                "Débutant / A1": 30,
                              };
                              set("languageItems", (data.languageItems || []).map((x, k) => (k === i ? { ...x, level: lvl, percent: pctMap[lvl] || 70 } : x)));
                            }}
                          >
                            <option>Langue maternelle</option>
                            <option>Bilingue</option>
                            <option>Excellent / C2</option>
                            <option>Avancé / C1</option>
                            <option>Intermédiaire élevé / B2</option>
                            <option>Intermédiaire / B1</option>
                            <option>Élémentaire / A2</option>
                            <option>Débutant / A1</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full gap-1"
                      onClick={() => set("languageItems", [...(data.languageItems || []), { name: "", level: "Intermédiaire élevé / B2", percent: 70 }])}
                    >
                      <Plus className="h-4 w-4" /> Ajouter une langue
                    </Button>
                  </div>
                )}

                {/* Étape 8 : Rubriques supplémentaires */}
                {step === 8 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold mb-1">Ajouter une nouvelle rubrique :</div>
                    <div className="flex flex-wrap gap-1">
                      {["Cours", "Stages", "Activités", "Références", "Qualités", "Certificats", "Réalisations", "Bas de page", "Rubrique personnalisée"].map((rub) => (
                        <Button
                          key={rub}
                          size="sm"
                          variant="outline"
                          onClick={() => set("sections", [...(data.sections || []), { key: crypto.randomUUID(), title: rub, content: "" }])}
                        >
                          + {rub}
                        </Button>
                      ))}
                    </div>
                    {(data.sections || []).map((sec) => (
                      <div key={sec.key} className="space-y-1 rounded-md border p-2 mt-2">
                        <div className="flex items-center justify-between">
                          <input
                            className={inputCls + " mt-0 font-semibold"}
                            value={sec.title}
                            onChange={(e) => set("sections", (data.sections || []).map((s) => (s.key === sec.key ? { ...s, title: e.target.value } : s)))}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => set("sections", (data.sections || []).filter((s) => s.key !== sec.key))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {sec.title.toLowerCase() === "stages" && <div className="grid grid-cols-2 gap-2">
                          <Field label="Année de début" placeholder="AAAA" value={sec.start || ""} onChange={value => set("sections", (data.sections || []).map(item => item.key === sec.key ? { ...item, start: value } : item))} />
                          <Field label="Année de fin" placeholder="AAAA ou En cours" value={sec.end || ""} onChange={value => set("sections", (data.sections || []).map(item => item.key === sec.key ? { ...item, end: value } : item))} />
                        </div>}
                        <textarea
                          rows={2}
                          className={inputCls}
                          value={sec.content}
                          placeholder="Détails de la rubrique..."
                          onChange={(e) => set("sections", (data.sections || []).map((s) => (s.key === sec.key ? { ...s, content: e.target.value } : s)))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Étape 9 : Signature Tactile & Importation */}
                {step === 9 && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold mb-1">Signez directement au doigt ou à la souris :</div>
                      <div className="rounded-lg border-2 border-primary/30 bg-white p-1">
                        <canvas
                          ref={sigCanvasRef}
                          width={400}
                          height={140}
                          className="w-full h-32 cursor-crosshair touch-none bg-white rounded"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            setIsDrawing(true);
                            const canvas = sigCanvasRef.current;
                            if (!canvas) return;
                            const rect = canvas.getBoundingClientRect();
                            const scaleX = canvas.width / rect.width;
                            const scaleY = canvas.height / rect.height;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.lineWidth = 2.5;
                              ctx.lineCap = "round";
                              ctx.lineJoin = "round";
                              ctx.strokeStyle = "#111827";
                              ctx.beginPath();
                              ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                            }
                          }}
                          onPointerMove={(e) => {
                            if (!isDrawing) return;
                            e.preventDefault();
                            const canvas = sigCanvasRef.current;
                            if (!canvas) return;
                            const rect = canvas.getBoundingClientRect();
                            const scaleX = canvas.width / rect.width;
                            const scaleY = canvas.height / rect.height;
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                              ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                              ctx.stroke();
                            }
                          }}
                          onPointerUp={() => {
                            setIsDrawing(false);
                            if (sigCanvasRef.current) {
                              const dataUrl = sigCanvasRef.current.toDataURL("image/png");
                              set("signatureImage", dataUrl);
                              localStorage.setItem(SIG_STORE, dataUrl);
                            }
                          }}
                          onPointerLeave={() => setIsDrawing(false)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground shadow-xs hover:bg-secondary/80">
                        <ImagePlus className="h-3.5 w-3.5" /> Importer une signature (photo/scan)
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const res = String(reader.result);
                              set("signatureImage", res);
                              localStorage.setItem(SIG_STORE, res);
                              toast.success("Signature importée et ajoutée au CV !");
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive text-xs"
                        onClick={() => {
                          const ctx = sigCanvasRef.current?.getContext("2d");
                          if (ctx && sigCanvasRef.current) {
                            ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
                          }
                          set("signatureImage", "");
                          localStorage.removeItem(SIG_STORE);
                          toast.info("Signature effacée.");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Effacer
                      </Button>
                    </div>

                    {data.signatureImage && (
                      <div className="rounded-md border bg-muted/40 p-2 text-xs flex items-center justify-between">
                        <span className="text-muted-foreground">Signature active sur le CV</span>
                        <img src={data.signatureImage} alt="Signature active" className="h-8 max-w-[120px] object-contain border bg-white rounded px-1" />
                      </div>
                    )}

                    <div className="border-t pt-2">
                      <Field
                        label="Ou tapez votre nom pour signature calligraphiée"
                        value={data.signature || ""}
                        onChange={(v) => set("signature", v)}
                        placeholder="Ex: Sarah Garcia"
                      />
                    </div>
                  </div>
                )}

                {/* Boutons Suivant / Précédent */}
                <div className="mt-4 flex items-center gap-3 border-t pt-3">
                  <Button size="sm" variant="outline" disabled={step <= 1} onClick={() => setStep((s) => s - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                  </Button>
                  {step < WIZARD_STEPS.length ? (
                    <Button className="h-12 flex-1 text-base font-semibold" onClick={nextStep}>
                      Suivant <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button className="h-12 flex-1 text-base font-semibold" onClick={nextStep}>
                      Finaliser le CV
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne Aperçu en direct & actions */}
            {finalized && <div className="min-w-0 space-y-3" ref={previewRef}>
              {actionsBar}

              {/* Aperçu avec Zoom manuel à 2 doigts + défilement libre */}
              <div
                className="overflow-auto rounded-xl border bg-muted shadow-lg cursor-pointer transition hover:ring-2 hover:ring-primary/40 touch-pan-x touch-pan-y"
                onClick={onPreviewTap}
                title="Touchez un élément pour ouvrir sa rubrique, ou écartez 2 doigts pour agrandir"
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    const d = Math.hypot(
                      e.touches[0]!.clientX - e.touches[1]!.clientX,
                      e.touches[0]!.clientY - e.touches[1]!.clientY
                    );
                    pinchStart.current = { d, z: cvScale };
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && pinchStart.current) {
                    const d = Math.hypot(
                      e.touches[0]!.clientX - e.touches[1]!.clientX,
                      e.touches[0]!.clientY - e.touches[1]!.clientY
                    );
                    const newScale = Math.min(2.5, Math.max(0.6, pinchStart.current.z * (d / pinchStart.current.d)));
                    setCvScale(Number(newScale.toFixed(2)));
                  }
                }}
                onTouchEnd={() => {
                  pinchStart.current = null;
                }}
              >
                <div style={{ transform: `scale(${cvScale})`, transformOrigin: "top left", width: cvScale > 1 ? `${cvScale * 100}%` : "100%" }}>
                  <CvPreview compact={false} html={html} />
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Astuce : pincez à 2 doigts pour agrandir • touchez la photo ou un texte pour modifier sa rubrique.
              </p>

              {/* Personnalisation complète sous le CV : Police, Taille de texte, Couleurs et Zoom */}
              <div className="rounded-lg border bg-card p-3 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="text-xs font-semibold">Taille, Police & Couleurs du CV</div>
                  {/* Boutons d'agrandissement manuel (Loupe) */}
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground mr-1">Zoom : {Math.round(cvScale * 100)}%</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-1.5 text-xs"
                      onClick={() => setCvScale((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
                      title="Réduire le zoom"
                    >
                      −
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-1.5 text-xs font-mono"
                      onClick={() => setCvScale(1)}
                      title="Taille normale"
                    >
                      100%
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-1.5 text-xs"
                      onClick={() => setCvScale((z) => Math.min(2.5, Number((z + 0.2).toFixed(2))))}
                      title="Agrandir"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="text-xs text-muted-foreground">
                    Police de texte
                    <select
                      className={inputCls}
                      value={data.customFont || sel.font}
                      onChange={(e) => set("customFont", e.target.value)}
                    >
                      <option value="Calibri">Calibri (Très lisible)</option>
                      <option value="Verdana">Verdana (Aéré & clair)</option>
                      <option value="Arial">Arial (Moderne)</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia (Élégant)</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                    </select>
                  </label>

                  <label className="text-xs text-muted-foreground">
                    Taille du texte
                    <select
                      className={inputCls}
                      value={data.fontSize || "normal"}
                      onChange={(e) => set("fontSize" as any, e.target.value)}
                    >
                      <option value="normal">12 pt</option>
                      <option value="large">Grande (Lecture facile)</option>
                      <option value="xlarge">Très grande (Confort)</option>
                      <option value="compact">Compacte (Économique)</option>
                    </select>
                  </label>

                  <label className="text-xs text-muted-foreground">
                    Couleur gauche
                    <input
                      type="color"
                      className="cv-color-input mt-1 block h-8 w-8 cursor-pointer rounded-full border bg-muted"
                      value={data.customColor || sel.primary}
                      onChange={(e) => set("customColor", e.target.value)}
                    />
                  </label>

                  <label className="text-xs text-muted-foreground">
                    Couleur droite
                    <input
                      type="color"
                      className="cv-color-input mt-1 block h-8 w-8 cursor-pointer rounded-full border bg-muted"
                      value={data.rightColor || sel.accent || sel.primary}
                      onChange={(e) => set("rightColor", e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {actionsBar}
             {saveDialog}
             {paywallDialog}
            </div>}
          </div>
        </div>
      </AppShell>
    );
  }

  // Vue Catalogue Pro folio d'accueil
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-3 pb-24">
        <div className="mb-4 text-center">
          <h1 className="font-serif text-2xl font-bold">Modèles de CV Professionnels</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Choisissez le modèle qui vous plaît pour créer votre CV.
          </p>
        </div>

        {/* Modèle N°1 Sarah Garcia bordeaux mis en avant avec mention NOUVEAU */}
        {CV_TEMPLATES[0] && (
          <div className="mb-3 rounded-lg border border-border bg-card p-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground uppercase">Nouveau</span>
                <span className="font-bold text-sm">{CV_TEMPLATES[0].name}</span>
              </div>
              <Button size="icon" aria-label="Utiliser ce modèle" title="Utiliser ce modèle" className="shrink-0" onClick={() => selectModel(CV_TEMPLATES[0]!)}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-muted shadow-inner">
              <CvPreview compact={false} html={renderCvHtml(CV_TEMPLATES[0]!, sampleCvFor(CV_TEMPLATES[0]!))} />
            </div>

               <div className="mt-4 flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => document.getElementById("autres-modeles")?.scrollIntoView({ behavior: "smooth" })}
              >
                Défiler vers les autres modèles ↓
              </Button>
            </div>
          </div>
        )}

        {/* Défilement des autres modèles */}
        <div id="autres-modeles" className="space-y-6 scroll-mt-6">
          <h2 className="font-serif text-lg font-bold">Autres modèles disponibles</h2>
          {CV_TEMPLATES.slice(1).map((t) => (
            <div key={t.id} className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {t.isNew && <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">Nouveau</span>}
                  <span className="font-medium text-sm">{t.name}</span>
                </div>
                <Button size="icon" onClick={() => selectModel(t)} aria-label={`Utiliser ${t.name}`} title={`Utiliser ${t.name}`} className="shrink-0">
                  <Plus className="h-4 w-4" />
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
}
