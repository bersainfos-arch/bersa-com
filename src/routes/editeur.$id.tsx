import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Link2, Image, Table, Undo2, Redo2, Indent, Outdent, Printer, Download, ArrowLeft, Sparkles, SeparatorHorizontal, ListTree, Star,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { runWriter } from "@/lib/writer.functions";
import { CATEGORIES, MAX_CHARS, countWords, exportHtml } from "@/lib/docs";

export const Route = createFileRoute("/editeur/$id")({
  head: () => ({
    meta: [
      { title: "Éditeur A4 — BERSA" },
      { name: "description", content: "Éditeur de documents A4 avec assistant IA BERSA." },
      { property: "og:title", content: "Éditeur A4 — BERSA" },
      { property: "og:description", content: "Rédigez et mettez en page vos documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const AI = [
  ["improve", "Améliorer"], ["correct", "Corriger"], ["summarize", "Résumer"], ["expand", "Développer"],
  ["continue", "Continuer"], ["titles", "Titres"], ["outline", "Plan"], ["references", "Références"],
] as const;

const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

function Page() {
  const { id } = Route.useParams();
  const ed = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [fav, setFav] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"saved" | "saving" | "dirty">("saved");
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [ai, setAi] = useState<{ label: string; text: string; busy: boolean } | null>(null);
  const savedRange = useRef<Range | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    supabase.from("user_docs").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) { toast.error("Document introuvable"); return; }
      setTitle(data.title); setCategory(data.category); setTags(data.tags.join(", ")); setFav(data.favorite);
      if (ed.current) ed.current.innerHTML = data.content;
      refreshStats(); setLoaded(true);
    });
    exec("styleWithCSS", "true");
  }, [id]);

  function refreshStats() {
    const t = ed.current?.innerText ?? "";
    setStats({ words: countWords(t), chars: t.length });
  }

  function save(now = false) {
    setStatus("dirty");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!ed.current) return;
      setStatus("saving");
      const text = ed.current.innerText;
      const { error } = await supabase.from("user_docs").update({
        title: title.trim() || "Sans titre", category, favorite: fav, content: ed.current.innerHTML,
        word_count: countWords(text), updated_at: new Date().toISOString(),
        tags: tags.split(",").map((s) => s.trim().replace(/^#/, "")).filter(Boolean).slice(0, 20),
      }).eq("id", id);
      setStatus(error ? "dirty" : "saved");
      if (error) toast.error("Sauvegarde impossible : " + error.message);
    }, now ? 0 : 1200);
  }
  useEffect(() => { if (loaded) save(); }, [title, category, tags, fav]);

  function onInput() {
    refreshStats();
    if ((ed.current?.innerText.length ?? 0) > MAX_CHARS) toast.warning(`Le document dépasse ${MAX_CHARS.toLocaleString("fr-FR")} caractères.`, { id: "max" });
    save();
  }

  function cmd(c: string, v?: string) { ed.current?.focus(); exec(c, v); onInput(); }

  function insertHtml(html: string) {
    ed.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
    exec("insertHTML", html); onInput();
  }

  function addFootnote() {
    const note = window.prompt("Texte de la note de bas de page :"); if (!note) return;
    const n = (ed.current?.querySelectorAll("sup.fn").length ?? 0) + 1;
    exec("insertHTML", `<sup class="fn">${n}</sup>`);
    let box = ed.current?.querySelector("ol.footnotes");
    if (!box && ed.current) { ed.current.insertAdjacentHTML("beforeend", '<hr><ol class="footnotes"></ol>'); box = ed.current.querySelector("ol.footnotes"); }
    box?.insertAdjacentHTML("beforeend", `<li>${note.replace(/</g, "&lt;")}</li>`);
    onInput();
  }

  function addToc() {
    const hs = Array.from(ed.current?.querySelectorAll("h1,h2,h3") ?? []);
    if (!hs.length) { toast.info("Ajoutez d'abord des titres H1, H2 ou H3."); return; }
    const items = hs.map((h) => `<li style="margin-left:${(Number(h.tagName[1]) - 1) * 20}px">${h.textContent}</li>`).join("");
    ed.current?.querySelector(".toc")?.remove();
    ed.current?.insertAdjacentHTML("afterbegin", `<div class="toc"><p><b>TABLE DES MATIÈRES</b></p><ul style="list-style:none;padding:0">${items}</ul></div>`);
    onInput();
  }

  async function runAi(action: string, label: string) {
    const sel = window.getSelection();
    const selected = sel && ed.current?.contains(sel.anchorNode) ? sel.toString() : "";
    if (sel && sel.rangeCount && ed.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
    const text = (selected || ed.current?.innerText || "").slice(0, 15000);
    if (!text.trim()) { toast.info("Écrivez ou sélectionnez d'abord un texte."); return; }
    setAi({ label, text: "", busy: true });
    const prompt = action === "titles" ? `Propose 5 titres pertinents pour le texte suivant.\n\n${text}` : text;
    try {
      const r = await runWriter({ data: { action: action === "titles" ? "chat" : action, messages: [{ role: "user", content: prompt }] } });
      setAi({ label, text: r.reply, busy: false });
    } catch (e) {
      setAi(null); toast.error((e as Error).message);
    }
  }

  const toHtml = (t: string) => t.split(/\n{2,}/).map((p) => `<p>${p.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join("");

  const B = ({ icon: I, on, label }: { icon: typeof Bold; on: () => void; label: string }) => (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={on} className="rounded p-1.5 hover:bg-muted"><I className="h-4 w-4" /></button>
  );

  return (
    <AppShell>
      <div className="no-print sticky top-16 z-20 border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-2">
          <Link to="/documents" className="rounded p-1.5 hover:bg-muted" aria-label="Retour"><ArrowLeft className="h-4 w-4" /></Link>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du document" className="h-8 w-48 flex-1 font-semibold" maxLength={200} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-8 rounded-md border bg-card px-2 text-sm">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (séparés par des virgules)" className="h-8 w-48" />
          <button onClick={() => setFav(!fav)} aria-label="Favori"><Star className={`h-4 w-4 ${fav ? "fill-gold text-gold" : "text-muted-foreground"}`} /></button>
          <span className="text-xs text-muted-foreground">{status === "saved" ? "Enregistré" : status === "saving" ? "Enregistrement…" : "Modifié"}</span>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-0.5 overflow-x-auto px-3 pb-2">
          <B icon={Undo2} label="Annuler" on={() => cmd("undo")} /><B icon={Redo2} label="Rétablir" on={() => cmd("redo")} />
          <select onChange={(e) => { cmd("formatBlock", e.target.value); e.target.value = ""; }} defaultValue="" className="h-8 rounded border bg-card px-1 text-xs">
            <option value="" disabled>Style</option><option value="p">Paragraphe</option><option value="h1">Titre 1</option><option value="h2">Titre 2</option><option value="h3">Titre 3</option>
          </select>
          <select onChange={(e) => { cmd("fontName", e.target.value); e.target.value = ""; }} defaultValue="" className="h-8 rounded border bg-card px-1 text-xs">
            <option value="" disabled>Police</option>{["Times New Roman", "Arial", "Georgia", "Calibri", "Garamond", "Courier New"].map((f) => <option key={f}>{f}</option>)}
          </select>
          <select onChange={(e) => { cmd("fontSize", e.target.value); e.target.value = ""; }} defaultValue="" className="h-8 rounded border bg-card px-1 text-xs">
            <option value="" disabled>Taille</option><option value="2">10 pt</option><option value="3">12 pt</option><option value="4">14 pt</option><option value="5">18 pt</option><option value="6">24 pt</option>
          </select>
          <input type="color" aria-label="Couleur du texte" onChange={(e) => cmd("foreColor", e.target.value)} className="h-7 w-7 cursor-pointer rounded border" />
          <B icon={Bold} label="Gras" on={() => cmd("bold")} /><B icon={Italic} label="Italique" on={() => cmd("italic")} />
          <B icon={Underline} label="Souligné" on={() => cmd("underline")} /><B icon={Strikethrough} label="Barré" on={() => cmd("strikeThrough")} />
          <B icon={List} label="Puces" on={() => cmd("insertUnorderedList")} /><B icon={ListOrdered} label="Numérotation" on={() => cmd("insertOrderedList")} />
          <B icon={Outdent} label="Diminuer le retrait" on={() => cmd("outdent")} /><B icon={Indent} label="Augmenter le retrait" on={() => cmd("indent")} />
          <B icon={AlignLeft} label="Gauche" on={() => cmd("justifyLeft")} /><B icon={AlignCenter} label="Centrer" on={() => cmd("justifyCenter")} />
          <B icon={AlignRight} label="Droite" on={() => cmd("justifyRight")} /><B icon={AlignJustify} label="Justifier" on={() => cmd("justifyFull")} />
          <B icon={Quote} label="Citation" on={() => cmd("formatBlock", "blockquote")} />
          <B icon={Link2} label="Lien" on={() => { const u = window.prompt("Adresse du lien (https://…)"); if (u && /^https?:\/\//.test(u)) cmd("createLink", u); }} />
          <B icon={Image} label="Image" on={() => { const u = window.prompt("Adresse de l'image (https://…)"); if (u && /^https?:\/\//.test(u)) cmd("insertImage", u); }} />
          <B icon={Table} label="Tableau" on={() => cmd("insertHTML", `<table><tbody>${"<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>".repeat(3)}</tbody></table><p></p>`)} />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={addFootnote} className="rounded px-1.5 text-xs font-semibold hover:bg-muted">Note¹</button>
          <B icon={ListTree} label="Table des matières" on={addToc} />
          <B icon={SeparatorHorizontal} label="Saut de page" on={() => cmd("insertHTML", '<div class="page-break"></div><p></p>')} />
          <B icon={Download} label="Exporter HTML" on={() => exportHtml(title, ed.current?.innerHTML ?? "")} />
          <B icon={Printer} label="Imprimer / PDF" on={() => window.print()} />
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-3 pb-2">
          <Sparkles className="h-4 w-4 text-gold" />
          {AI.map(([a, l]) => (
            <button key={a} onMouseDown={(e) => e.preventDefault()} onClick={() => runAi(a, l)} className="rounded-full border border-gold/50 px-2.5 py-0.5 text-xs font-medium hover:bg-accent">{l}</button>
          ))}
        </div>
      </div>
      <div className="a4-desk overflow-x-auto bg-muted px-2 py-6">
        <div
          ref={ed}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onBlur={() => save(true)}
          className="a4-page mx-auto"
          data-placeholder="Commencez à écrire…"
        />
        <p className="no-print mx-auto mt-2 max-w-[794px] text-right text-xs text-muted-foreground">{stats.words} mots · {stats.chars.toLocaleString("fr-FR")} caractères</p>
      </div>
      <Dialog open={!!ai} onOpenChange={(o) => !o && setAi(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{ai?.label} — proposition de l'IA</DialogTitle></DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{ai?.busy ? "Rédaction en cours…" : ai?.text}</div>
          {!ai?.busy && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(ai?.text ?? ""); toast.success("Copié"); }}>Copier</Button>
              <Button variant="outline" onClick={() => { insertHtml(toHtml(ai?.text ?? "")); setAi(null); }}>Remplacer la sélection</Button>
              <Button onClick={() => { ed.current?.insertAdjacentHTML("beforeend", toHtml(ai?.text ?? "")); onInput(); setAi(null); }}>Ajouter au document</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
