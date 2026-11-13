import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileDown, FileText, ImageDown, Loader2, PenLine, Sparkles, Wand2 } from "lucide-react";
import { createParser } from "eventsource-parser";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CvPreview } from "@/components/CvPreview";
import { LETTER_TEMPLATES, emptyData, letterSheet, sampleData, improvePrompt, parseImproved, type LetterTemplate } from "@/lib/letter-templates";

export const Route = createFileRoute("/lettres")({
  head: () => ({ meta: [
    { title: "Lettres administratives éditables | BERSA" },
    { name: "description", content: "Lettre de motivation, demande d’emploi et note de service : remplissez vos données, générez et modifiez sur l’Atelier." },
    { property: "og:title", content: "Lettres administratives BERSA" },
    { property: "og:description", content: "Modèles de lettres officielles à remplir et générer en un clic." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Lettres,
});

const inputCls = "mt-1 w-full rounded-md border bg-background p-2 text-sm text-foreground";

function Lettres() {
  const navigate = useNavigate();
  const [tpl, setTpl] = useState<LetterTemplate | null>(null);
  const [data, setData] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.45);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 794))); ro.observe(el); return () => ro.disconnect();
  }, [generated]);
  const currentHtml = () => sheetRef.current?.innerHTML ?? generated ?? "";
  const fileBase = () => (tpl?.label ?? "Lettre").replace(/[^\p{L}\p{N}]+/gu, "_");
  const download = (blob: Blob, name: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  const filledData = () => tpl ? Object.fromEntries(tpl.fields.map(f => [f.key, data[f.key]?.trim() || f.sample])) : {};
  const improve = async () => {
    if (!tpl) return; setBusy("improve");
    try {
      const d = filledData();
      const { data: s } = await supabase.auth.getSession(); if (!s.session) throw new Error("Connectez-vous pour améliorer la lettre.");
      const res = await fetch("/api/writer", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session.access_token}` }, body: JSON.stringify({ action: "improve", text: improvePrompt(tpl, d) }) });
      if (!res.ok || !res.body) throw new Error((await res.text()) || "Assistant indisponible.");
      let reply = "", fail = "";
      const parser = createParser({ onEvent(e) { try { const it = JSON.parse(e.data); if (it.type === "delta") reply += it.text; if (it.type === "error") fail = it.message; } catch {} } });
      const reader = res.body.getReader(), dec = new TextDecoder();
      for (;;) { const c = await reader.read(); if (c.done) break; parser.feed(dec.decode(c.value, { stream: true })); }
      if (fail) throw new Error(fail);
      const better = parseImproved(reply); if (!better) throw new Error("Réponse inattendue, réessayez.");
      const next = { ...d, ...better } as Record<string, string>;
      setData(next); setGenerated(tpl.render(next));
      toast.success("Texte amélioré — vos informations personnelles sont inchangées.");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Échec"); } finally { setBusy(null); }
  };
  const saveWord = () => {
    const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:21cm 29.7cm;margin:2cm}body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}p{margin:0 0 6pt}</style></head><body>${currentHtml()}</body></html>`;
    download(new Blob(["\ufeff", doc], { type: "application/msword" }), `${fileBase()}.doc`);
  };
  const capture = async () => {
    const node = sheetRef.current!; const { toPng } = await import("html-to-image");
    return toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", style: { transform: "none" }, width: 794, height: node.scrollHeight });
  };
  const savePhoto = async () => { setBusy("png"); try { const url = await capture(); const a = document.createElement("a"); a.href = url; a.download = `${fileBase()}.png`; a.click(); } catch { toast.error("Échec de l’image"); } finally { setBusy(null); } };
  const savePdf = async () => {
    setBusy("pdf");
    try {
      const url = await capture(); const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" }); const h = Math.min(297, (sheetRef.current!.scrollHeight / 794) * 210);
      pdf.addImage(url, "PNG", 0, 0, 210, h); pdf.save(`${fileBase()}.pdf`);
    } catch { toast.error("Échec du PDF"); } finally { setBusy(null); }
  };
  const samples = useMemo(() => LETTER_TEMPLATES.map(t => letterSheet(t.html)), []);

  const open = (t: LetterTemplate) => { setTpl(t); setData(emptyData(t)); setGenerated(null); window.scrollTo(0, 0); };
  const generate = () => {
    if (!tpl) return;
    const filled = Object.fromEntries(tpl.fields.map(f => [f.key, data[f.key]?.trim() || f.sample]));
    setGenerated(tpl.render(filled));
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const toAtelier = () => {
    if (!generated || !tpl) return;
    sessionStorage.setItem("bersa-document-html", currentHtml());
    sessionStorage.setItem("bersa-document-title", tpl.label);
    toast.success("Lettre ouverte dans l’Atelier");
    navigate({ to: "/redaction" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-4">
        {!tpl ? (<>
          <h1 className="font-serif text-2xl font-bold text-foreground">Lettres administratives</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choisissez un modèle, remplissez vos données puis générez.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LETTER_TEMPLATES.map((t, i) => (
              <button key={t.id} onClick={() => open(t)} className="overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="pointer-events-none border-b bg-white"><CvPreview html={samples[i] ?? ""} /></div>
                <p className="p-2 text-xs font-semibold text-foreground">{t.label}</p>
              </button>
            ))}
          </div>
        </>) : (<>
          <button onClick={() => setTpl(null)} className="flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="size-4" />Tous les modèles</button>
          <h1 className="mt-2 font-serif text-xl font-bold text-foreground">{tpl.label}</h1>
          <div className="mt-3 space-y-2 rounded-lg border bg-card p-3">
            {tpl.fields.map(f => (
              <label key={f.key} className="block text-xs font-medium text-muted-foreground">{f.label}
                {f.multi
                  ? <textarea rows={f.key === "corps" ? 7 : 3} className={inputCls} placeholder={f.sample} value={data[f.key] ?? ""} onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))} />
                  : <input className={inputCls} placeholder={f.sample} value={data[f.key] ?? ""} onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))} />}
              </label>
            ))}
            <p className="text-[11px] text-muted-foreground">Une case laissée vide reprend l’exemple affiché en gris.</p>
            <div className="flex gap-2 pt-1">
              <Button onClick={generate} className="flex-1"><Sparkles className="size-4" />Générer</Button>
              <Button variant="outline" onClick={() => setData(sampleData(tpl))}>Voir l’exemple</Button>
            </div>
            <Button variant="secondary" className="w-full" disabled={!!busy} onClick={improve}>{busy === "improve" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}Améliorer le texte et les formules avec BERSA</Button>
            <p className="text-[11px] text-muted-foreground">Seuls la formule d’appel, le développement et la formule de politesse sont améliorés ; vos informations personnelles ne changent pas.</p>
          </div>
          {generated && (
            <div ref={resultRef} className="mt-5">
              <h2 className="text-sm font-bold text-foreground">Lettre générée</h2>
              <p className="text-[11px] text-muted-foreground">Touchez le texte de la feuille pour le retoucher directement.</p>
              <div className="my-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button size="sm" variant="outline" onClick={saveWord}><FileText className="size-4" />Word</Button>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={savePdf}>{busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}PDF</Button>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={savePhoto}>{busy === "png" ? <Loader2 className="size-4 animate-spin" /> : <ImageDown className="size-4" />}Photo</Button>
                <Button size="sm" onClick={toAtelier}><PenLine className="size-4" />Atelier</Button>
              </div>
              <div ref={boxRef} className="overflow-hidden rounded-md border bg-white shadow-md" style={{ height: (sheetRef.current?.scrollHeight ?? 1123) * scale }}>
                <div style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <div key={generated} ref={sheetRef} contentEditable suppressContentEditableWarning className="outline-none" style={{ width: 794, minHeight: 1123, background: "#fff", color: "#111", padding: "76px 72px", boxSizing: "border-box", fontFamily: "'Times New Roman',serif", fontSize: 16, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: generated }} />
                </div>
              </div>
            </div>
          )}
        </>)}
      </div>
    </AppShell>
  );
}
