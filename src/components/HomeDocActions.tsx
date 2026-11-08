import { useState } from "react";
import { MoreVertical, Eye, FolderOpen, Pencil, Share2, Download, Copy, Trash2, Smartphone, Info, ExternalLink, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sanitizeDocumentHtml } from "@/lib/document-import";

export interface DocRef { id: string; title: string; }

type Full = { title: string; content: string; created_at: string; updated_at: string; word_count: number; category: string };

async function fetchDoc(id: string): Promise<Full> {
  const { data, error } = await supabase.from("user_docs").select("title, content, created_at, updated_at, word_count, category").eq("id", id).single();
  if (error || !data) throw new Error("Document introuvable.");
  return data;
}

const safeName = (t: string) => (t || "document").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80);
const toHtml = (c: string) => sanitizeDocumentHtml(/<\w+[^>]*>/.test(c) ? c : c.split(/\n/).map((l) => `<p>${l.replace(/[<>&]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[m] ?? m))}</p>`).join(""));
const toText = (c: string) => { const d = document.createElement("div"); d.innerHTML = toHtml(c); return d.innerText; };

function makeFile(doc: Full, fmt: "doc" | "txt" | "html"): File {
  const name = safeName(doc.title);
  if (fmt === "txt") return new File([toText(doc.content)], `${name}.txt`, { type: "text/plain" });
  const html = `<html><head><meta charset="utf-8"><title>${name}</title></head><body style="font-family:'Times New Roman';font-size:13pt;line-height:1.6">${toHtml(doc.content)}</body></html>`;
  return fmt === "doc" ? new File([html], `${name}.doc`, { type: "application/msword" }) : new File([html], `${name}.html`, { type: "text/html" });
}

async function saveFile(file: File) {
  const w = window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }> };
  if (w.showSaveFilePicker) {
    try { const h = await w.showSaveFilePicker({ suggestedName: file.name }); const s = await h.createWritable(); await s.write(file); await s.close(); toast.success("Document enregistré dans le dossier choisi."); return; }
    catch (e) { if ((e as Error).name === "AbortError") return; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function printPdf(doc: Full) {
  const w = window.open("", "_blank"); if (!w) { toast.error("Autorisez les fenêtres pour exporter en PDF."); return; }
  w.document.write(`<html><head><meta charset="utf-8"><title>${safeName(doc.title)}</title><style>@page{size:A4;margin:2cm}body{font-family:'Times New Roman';font-size:13pt;line-height:1.6}</style></head><body>${toHtml(doc.content)}</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

export function HomeDocActions({ doc, onOpen, onChanged }: { doc: DocRef; onOpen: () => void; onChanged: () => void }) {
  const [preview, setPreview] = useState<Full | null>(null);
  const [props, setProps] = useState<Full | null>(null);

  const run = (fn: (d: Full) => Promise<void> | void) => async () => { try { await fn(await fetchDoc(doc.id)); } catch (e) { toast.error((e as Error).message); } };

  const share = run(async (d) => {
    const file = makeFile(d, "doc");
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: d.title }); } catch {} return; }
    if (navigator.share) { try { await navigator.share({ title: d.title, text: toText(d.content).slice(0, 4000) }); } catch {} return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${d.title}\n\n${toText(d.content).slice(0, 1500)}`)}`, "_blank");
  });
  const rename = async () => {
    const t = window.prompt("Nouveau nom du document", doc.title)?.trim(); if (!t) return;
    const { error } = await supabase.from("user_docs").update({ title: t }).eq("id", doc.id);
    error ? toast.error("Renommage impossible.") : (toast.success("Document renommé."), onChanged());
  };
  const duplicate = (label: string) => run(async (d) => {
    const folder = window.prompt(`${label} — nom du dossier`, d.category || "Général")?.trim(); if (!folder) return;
    const { data: u } = await supabase.auth.getUser(); if (!u.user) return;
    const { error } = await supabase.from("user_docs").insert({ user_id: u.user.id, title: `${d.title} (copie)`, content: d.content, category: folder, word_count: d.word_count });
    error ? toast.error("Copie impossible.") : (toast.success(`Copié dans « ${folder} ».`), onChanged());
  });
  const move = run(async (d) => {
    const folder = window.prompt("Déplacer vers le dossier", d.category || "Général")?.trim(); if (!folder) return;
    const { error } = await supabase.from("user_docs").update({ category: folder }).eq("id", doc.id);
    error ? toast.error("Déplacement impossible.") : (toast.success(`Déplacé vers « ${folder} ».`), onChanged());
  });
  const remove = async () => {
    if (!window.confirm(`Supprimer « ${doc.title} » définitivement ?`)) return;
    const { error } = await supabase.from("user_docs").delete().eq("id", doc.id);
    error ? toast.error("Suppression impossible.") : (toast.success("Document supprimé."), onChanged());
  };
  const shortcut = () => {
    localStorage.setItem("bersa-pinned-doc", doc.id);
    toast.info("Document épinglé. Pour l’icône sur l’écran du téléphone : menu du navigateur › « Ajouter à l’écran d’accueil ».", { duration: 7000 });
  };
  const openWith = run(async (d) => saveFile(makeFile(d, "doc")));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} aria-label={`Options de ${doc.title}`} className="shrink-0 text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onOpen}><FolderOpen className="mr-2 h-4 w-4" />Ouvrir</DropdownMenuItem>
          <DropdownMenuItem onClick={run((d) => setPreview(d))}><Eye className="mr-2 h-4 w-4" />Visualiser</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger><Download className="mr-2 h-4 w-4" />Enregistrer sous…</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={run((d) => saveFile(makeFile(d, "doc")))}>Word (.doc)</DropdownMenuItem>
              <DropdownMenuItem onClick={run((d) => printPdf(d))}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={run((d) => saveFile(makeFile(d, "txt")))}>Texte (.txt)</DropdownMenuItem>
              <DropdownMenuItem onClick={run((d) => saveFile(makeFile(d, "html")))}>Page web (.html)</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={rename}><Pencil className="mr-2 h-4 w-4" />Renommer</DropdownMenuItem>
          <DropdownMenuItem onClick={share}><Share2 className="mr-2 h-4 w-4" />Partager…</DropdownMenuItem>
          <DropdownMenuItem onClick={openWith}><ExternalLink className="mr-2 h-4 w-4" />Ouvrir avec une autre application</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={move}><FolderOpen className="mr-2 h-4 w-4" />Déplacer</DropdownMenuItem>
          <DropdownMenuItem onClick={duplicate("Copier vers")}><Copy className="mr-2 h-4 w-4" />Copier vers un dossier</DropdownMenuItem>
          <DropdownMenuItem onClick={shortcut}><Smartphone className="mr-2 h-4 w-4" />Épingler sur cet appareil</DropdownMenuItem>
          <DropdownMenuItem onClick={run((d) => setProps(d))}><History className="mr-2 h-4 w-4" />Dates et propriétés</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={remove} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[88vh] w-[96vw] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle className="truncate">{preview?.title}</DialogTitle></DialogHeader>
          {preview && <div className="mx-auto w-full min-w-0 overflow-x-auto rounded border bg-card p-4 text-[13pt] leading-[1.6] text-card-foreground [font-family:'Times_New_Roman'] break-words [&_img]:max-w-full [&_table]:max-w-full" dangerouslySetInnerHTML={{ __html: toHtml(preview.content) }} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!props} onOpenChange={(o) => !o && setProps(null)}>
        <DialogContent className="w-[92vw] max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Info className="h-4 w-4" />Propriétés</DialogTitle></DialogHeader>
          {props && <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Nom</dt><dd className="break-words">{props.title}</dd>
            <dt className="text-muted-foreground">Dossier</dt><dd>{props.category || "Général"}</dd>
            <dt className="text-muted-foreground">Mots</dt><dd>{props.word_count}</dd>
            <dt className="text-muted-foreground">Taille</dt><dd>{(new Blob([props.content]).size / 1024).toFixed(1)} Ko</dd>
            <dt className="text-muted-foreground">Créé</dt><dd>{new Date(props.created_at).toLocaleString("fr-FR")}</dd>
            <dt className="text-muted-foreground">Modifié</dt><dd>{new Date(props.updated_at).toLocaleString("fr-FR")}</dd>
          </dl>}
        </DialogContent>
      </Dialog>
    </>
  );
}

function sanitize(html: string) {
  const d = document.createElement("div"); d.innerHTML = html;
  d.querySelectorAll("script,style,iframe,object,embed").forEach((n) => n.remove());
  d.querySelectorAll("*").forEach((el) => [...el.attributes].forEach((a) => { if (/^on/i.test(a.name) || /javascript:/i.test(a.value)) el.removeAttribute(a.name); }));
  return d.innerHTML;
}
