import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Tpl { id: string; title: string; badge: string; prompt: string; published: boolean }

export function AdminTemplateManager() {
  const [list, setList] = useState<Tpl[]>([]);
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("");
  const [prompt, setPrompt] = useState("");

  const load = async () => {
    const { data } = await supabase.from("document_templates").select("id, title, badge, prompt, published").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const add = async () => {
    const { error } = await supabase.from("document_templates").insert({ title: title.trim(), badge, prompt: prompt.trim(), published: true });
    if (error) { toast.error("Enregistrement impossible."); return; }
    toast.success("Modèle enregistré et publié.");
    setTitle(""); setPrompt(""); setBadge(""); void load();
  };
  const toggle = async (t: Tpl) => { await supabase.from("document_templates").update({ published: !t.published }).eq("id", t.id); void load(); };
  const remove = async (id: string) => { await supabase.from("document_templates").delete().eq("id", id); void load(); };

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Modèles de documents</h2>
      <div className="mt-3 grid gap-2">
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Nom du modèle" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="rounded-md border px-3 py-2 text-sm" value={badge} onChange={(e) => setBadge(e.target.value)}>
          <option value="">Normal</option><option value="Nouveau">Nouveau</option><option value="Premium">Premium</option>
        </select>
        <textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" placeholder="Contenu ou consigne du modèle" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button disabled={!title.trim() || !prompt.trim()} onClick={add}>Enregistrer et publier</Button>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{t.title}{t.badge && ` · ${t.badge}`}</span>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => toggle(t)}>{t.published ? "Masquer" : "Publier"}</Button>
              <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
