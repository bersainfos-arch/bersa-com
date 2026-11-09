import { useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { importDocumentFile } from "@/lib/document-import";

interface Tpl { id: string; title: string; badge: string; prompt: string; published: boolean; file_name: string | null }
export function AdminTemplateManager() {
  const [list, setList] = useState<Tpl[]>([]);
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("");
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.from("document_templates").select("id, title, badge, prompt, published, file_name").order("created_at", { ascending: false });
    if (error) { toast.error("Chargement des modèles impossible."); return; }
    setList(data ?? []);
  };
  useEffect(() => { void load(); }, []);
  const add = async () => {
    if (busy || !title.trim() || (!html && !prompt.trim())) return;
    setBusy(true);
    const { error } = await supabase.from("document_templates").insert({ title: title.trim(), badge, prompt: prompt.trim(), content_html: html || null, file_name: fileName || null, published: true });
    setBusy(false);
    if (error) { toast.error("Enregistrement impossible."); return; }
    toast.success("Modèle enregistré et publié.");
    setTitle(""); setPrompt(""); setBadge(""); setHtml(""); setFileName(""); void load();
  };
  const toggle = async (t: Tpl) => {
    const { error } = await supabase.from("document_templates").update({ published: !t.published }).eq("id", t.id);
    if (error) toast.error("Publication impossible."); else void load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("document_templates").delete().eq("id", id);
    if (error) toast.error("Suppression impossible."); else void load();
  };
  return (
    <section className="min-w-0 py-4">
      <h2 className="font-semibold">Modèles de documents</h2>
      <div className="mt-3 grid gap-2">
        <input aria-label="Nom du modèle" className="min-w-0 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Nom du modèle" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select aria-label="Mention du modèle" className="rounded-md border bg-background px-3 py-2 text-sm" value={badge} onChange={(e) => setBadge(e.target.value)}>
          <option value="">Normal</option><option value="Nouveau">Nouveau</option><option value="Premium">Premium</option>
         <select
          aria-label="Domaine du modèle"
          className="rounded-md border bg-background px-3 py-2 text-sm font-medium"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        >
          <option value="Folio CV">Folio CV</option>
          <option value="Lettres administratives">Lettres administratives</option>
          <option value="Business">Business</option>
          <option value="Actes juridiques">Documents juridiques</option>
          <option value="Affiches">Affiches</option>
          <option value="Couverture">Couverture</option>
          <option value="Thèses & Mémoires">Thèses & Mémoires</option>
          <option value="Rapports">Rapports professionnels</option>
        </select>
        <label className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
          <Upload className="h-4 w-4 shrink-0" /><span className="truncate">{fileName || "Ajouter un modèle Word (.docx)"}</span>
          <input aria-label="Modèle Word" type="file" accept=".docx" className="sr-only" disabled={busy} onChange={async e => {
            const file = e.target.files?.[0]; e.target.value = "";
            if (!file) return;
            setBusy(true);
            try { const result = await importDocumentFile(file); setHtml(result.html); setFileName(file.name); if (!title) setTitle(file.name.replace(/\.docx$/i, "")); }
            catch (error) { toast.error(error instanceof Error ? error.message : "Document illisible."); }
            finally { setBusy(false); }
          }} />
        </label>
        {html && <div className="max-h-48 overflow-auto border bg-card p-3"><div className="pointer-events-none text-sm" dangerouslySetInnerHTML={{ __html: html }} /></div>}
        <textarea className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" placeholder="Consigne facultative pour le modèle Word" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button disabled={busy || !title.trim() || (!html && !prompt.trim())} onClick={add}>Enregistrer et publier</Button>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map(t => <li key={t.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b py-2 text-sm">
          <span className="min-w-0 flex-1 break-words">{t.title}{t.file_name && " · Word"}{t.badge && ` · ${t.badge}`}</span>
          <div className="flex shrink-0 items-center gap-1"><Button size="sm" variant="outline" onClick={() => toggle(t)}>{t.published ? "Masquer" : "Publier"}</Button><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button></div>
        </li>)}
      </ul>
    </section>
  );
}
