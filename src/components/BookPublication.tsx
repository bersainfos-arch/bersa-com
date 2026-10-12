import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Upload, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { runWriter } from "@/lib/writer.functions";
import { readAttachment } from "@/lib/attachments";
import { validateSummary } from "@/lib/books";
import { domains } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function BookPublication({ onSaved }: { onSaved: () => void }) {
 const { user } = useAuth(); const ask = useServerFn(runWriter);
 const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [preview, setPreview] = useState(false);
 const [summary, setSummary] = useState(""); const [generated, setGenerated] = useState(false); const [validated, setValidated] = useState(false);
 const [bookFile, setBookFile] = useState<File | null>(null); const [cover, setCover] = useState<File | null>(null);
 const [values, setValues] = useState<Record<string, string>>({ currency: "USD", domain: domains[0]?.fr ?? "Général", price: "0" });
 function field(name: string, label: string, extra: Record<string, unknown> = {}) { return <label className="space-y-1 text-xs">{label}<Input name={name} aria-label={label} value={values[name] ?? ""} onChange={e => setValues({ ...values, [name]: e.target.value })} {...extra} /></label>; }
 async function generate() {
  if (!bookFile) { toast.info("Ajoutez un fichier lisible (texte, Word ou PDF) pour générer le résumé. Pour un lien, saisissez le résumé vous-même."); return; }
  setBusy(true);
  try { const attachment = await readAttachment(bookFile); if (attachment.type === "other" || attachment.type === "image") throw new Error("Ce fichier ne permet pas d’extraire un résumé fidèle. Rédigez le résumé."); const result = await ask({ data: { action: "summarize", messages: [{ role: "user", content: "Résume fidèlement le livre joint en français, en 5 000 caractères maximum. N’invente aucun contenu inaccessible." }], attachments: [attachment] } }); setSummary(result.reply.slice(0, 5000)); setGenerated(true); setValidated(false); }
  catch (e) { toast.error(e instanceof Error ? e.message : "Résumé impossible."); } finally { setBusy(false); }
 }
 async function submit(e: React.FormEvent) {
  e.preventDefault(); const issue = validateSummary(summary, generated, validated); if (issue) { toast.error(issue); return; }
  if (!bookFile && !values["link"]) { toast.error("Ajoutez le fichier ou le lien du livre."); return; }
  if (values["link"] && !/^https:\/\//.test(values["link"])) { toast.error("Le lien doit commencer par https://."); return; }
  if (!preview) { setPreview(true); return; } if (!user) return;
  setBusy(true); const uploaded: string[] = []; let bookId: string | null = null;
  try {
   async function upload(file: File | null, image = false) { if (!file) return null; if (!file.size || file.size > (image ? 5 : 20) * 1024 * 1024) throw new Error(image ? "Couverture : 5 Mo maximum." : "Livre : 20 Mo maximum."); if (image && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Couverture : JPEG, PNG ou WebP."); const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") ?? "bin"; const path = `${user?.id}/${crypto.randomUUID()}.${extension}`; const { error } = await supabase.storage.from("books").upload(path, file); if (error) throw error; uploaded.push(path); return path; }
   const [path, coverPath] = await Promise.all([upload(bookFile), upload(cover, true)]);
   const { data, error } = await supabase.from("books").insert({ user_id: user.id, author: values["author"] ?? "", title: values["title"] ?? "", subtitle: values["subtitle"] || null, domain: values["domain"] ?? "", publication_place: values["place"] ?? "", publisher: values["publisher"] ?? "", publication_date: values["date"] ?? null, page_count: Number(values["pages"]), summary, price_usd: Number(values["price"]), currency: values["currency"] ?? "USD", file_path: path, cover_path: coverPath, status: "pending", summary_generated: generated, summary_validated: validated }).select("id").single();
   if (error || !data) throw error ?? new Error("Publication impossible."); bookId = data.id;
   if (values["link"]) { const { error: linkError } = await supabase.from("book_links").insert({ book_id: data.id, external_link: values["link"] }); if (linkError) throw linkError; }
   toast.success("Livre proposé — en attente de vérification."); setOpen(false); setPreview(false); onSaved();
  } catch (e) { if (!bookId && uploaded.length) await supabase.storage.from("books").remove(uploaded); toast.error(e instanceof Error ? e.message : "Publication impossible."); }
  finally { setBusy(false); }
 }
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Upload className="h-4 w-4" /> Publier un livre</Button></DialogTrigger><DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{preview ? "Aperçu de votre publication" : "Publier un livre"}</DialogTitle></DialogHeader>
  <form onSubmit={submit} className="space-y-3">
   {!preview ? <>
    <div className="grid gap-3 sm:grid-cols-2">{field("author", "Nom complet de l’auteur", { required: true, maxLength: 200 })}{field("title", "Titre", { required: true, maxLength: 200 })}{field("subtitle", "Sous-titre (facultatif)", { maxLength: 300 })}<label className="space-y-1 text-xs">Domaine<select aria-label="Domaine" value={values["domain"]} onChange={e => setValues({ ...values, domain: e.target.value })} className="h-9 w-full rounded border bg-background px-2">{domains.map(d => <option key={d.fr}>{d.fr}</option>)}</select></label>{field("place", "Lieu d’édition", { required: true, maxLength: 200 })}{field("publisher", "Maison d’édition", { required: true, maxLength: 200 })}{field("date", "Date de publication", { type: "date", required: true })}{field("pages", "Nombre de pages", { type: "number", min: 1, required: true })}{field("price", "Prix", { type: "number", min: 0, step: ".01", required: true })}{field("currency", "Devise", { required: true, pattern: "[A-Z]{3}", maxLength: 3 })}</div>
    <label className="block space-y-1 text-xs">Fichier du livre (20 Mo max.)<Input aria-label="Fichier du livre" type="file" onChange={e => setBookFile(e.target.files?.[0] ?? null)} /></label>{field("link", "Lien du livre (facultatif si fichier)", { type: "url", maxLength: 1500 })}
    <label className="block space-y-1 text-xs">Couverture (facultative, 5 Mo max.)<Input aria-label="Couverture" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setCover(e.target.files?.[0] ?? null)} /></label>
    <label className="block space-y-1 text-xs">Résumé<Textarea aria-label="Résumé" value={summary} onChange={e => { setSummary(e.target.value); setValidated(false); }} maxLength={5000} rows={5} /></label><div className="flex items-center justify-between text-xs"><Button type="button" size="sm" variant="outline" onClick={() => void generate()} disabled={busy}><Sparkles className="h-4 w-4" /> Générer le résumé</Button><span>{summary.length}/5 000</span></div>
    {generated && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={validated} onChange={e => setValidated(e.target.checked)} /> J’ai vérifié et je valide ce résumé avant publication.</label>}
    <p className="text-xs text-muted-foreground">Ventes en USD après vérification du paiement par BERSA. Les autres devises et livres payants sans fichier restent hors vente. Aucune coordonnée financière n’est demandée.</p>
   </> : <div className="space-y-2"><h2 className="text-2xl">{values["title"]}</h2><p>{values["subtitle"]}</p><p>{values["author"]} · {values["domain"]}</p><p className="text-sm">{values["place"]} · {values["publisher"]} · {values["pages"]} pages</p><p className="whitespace-pre-wrap text-sm">{summary}</p><p>{values["price"]} {values["currency"]}</p><p className="text-xs">{bookFile?.name ?? values["link"]}</p><Button variant="outline" type="button" onClick={() => setPreview(false)}>Modifier</Button></div>}
   <Button type="submit" className="w-full" disabled={busy}>{busy ? "En cours…" : preview ? "Soumettre pour vérification" : "Voir l’aperçu"}</Button>
  </form>
 </DialogContent></Dialog>;
}