import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdminTemplate { id: string; title: string; badge: "" | "Nouveau" | "Premium"; prompt: string }
const KEY = "bersa_admin_templates";

export function AdminTemplateManager() {
  const [list, setList] = useState<AdminTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState<AdminTemplate["badge"]>("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { setList([]); }
  }, []);
  const save = (next: AdminTemplate[]) => { setList(next); localStorage.setItem(KEY, JSON.stringify(next)); };

  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Modèles de documents</h2>
      <div className="mt-3 grid gap-2">
        <input className="rounded-md border px-3 py-2 text-sm" placeholder="Nom du modèle" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="rounded-md border px-3 py-2 text-sm" value={badge} onChange={(e) => setBadge(e.target.value as AdminTemplate["badge"])}>
          <option value="">Normal</option><option value="Nouveau">Nouveau</option><option value="Premium">Premium</option>
        </select>
        <textarea className="min-h-24 rounded-md border px-3 py-2 text-sm" placeholder="Contenu ou consigne du modèle" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <Button disabled={!title.trim() || !prompt.trim()} onClick={() => { save([...list, { id: crypto.randomUUID(), title: title.trim(), badge, prompt: prompt.trim() }]); setTitle(""); setPrompt(""); setBadge(""); }}>Ajouter le modèle</Button>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{t.title}{t.badge && ` · ${t.badge}`}</span>
            <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => save(list.filter((x) => x.id !== t.id))}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
