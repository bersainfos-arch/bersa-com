import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Star, Trash2, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/docs";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Mes documents — BERSA" },
      { name: "description", content: "Vos documents personnels rédigés dans l'éditeur A4 BERSA." },
      { property: "og:title", content: "Mes documents — BERSA" },
      { property: "og:description", content: "Créez, retrouvez et exportez vos documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Doc = { id: string; title: string; category: string; word_count: number; favorite: boolean; tags: string[]; updated_at: string; content: string };

function Page() {
  const nav = useNavigate();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<"recent" | "title" | "words">("recent");
  const [favOnly, setFavOnly] = useState(false);

  async function load() {
    const { data, error } = await supabase.from("user_docs").select("id,title,category,word_count,favorite,tags,updated_at,content").order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data as Doc[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const { data, error } = await supabase.from("user_docs").insert({}).select("id").single();
    if (error || !data) return toast.error(error?.message ?? "Erreur");
    nav({ to: "/editeur/$id", params: { id: data.id } });
  }
  async function remove(d: Doc) {
    if (!window.confirm(`Supprimer « ${d.title} » ? Cette action est définitive.`)) return;
    const { error } = await supabase.from("user_docs").delete().eq("id", d.id);
    if (error) toast.error(error.message); else { toast.success("Document supprimé"); load(); }
  }
  async function toggleFav(d: Doc) {
    await supabase.from("user_docs").update({ favorite: !d.favorite }).eq("id", d.id);
    load();
  }

  const list = useMemo(() => {
    let l = (docs ?? []).filter((d) =>
      (cat === "all" || d.category === cat) && (!favOnly || d.favorite) &&
      (d.title + " " + d.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));
    if (sort === "title") l = [...l].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "words") l = [...l].sort((a, b) => b.word_count - a.word_count);
    return l;
  }, [docs, q, cat, sort, favOnly]);

  return (
    <AppShell>
      <PageHeader title="Mes documents" subtitle="Rédigez sur une feuille A4, sauvegarde automatique." />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher un titre ou un tag…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border bg-card px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select className="h-9 rounded-md border bg-card px-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="recent">Plus récents</option><option value="title">Titre</option><option value="words">Nombre de mots</option>
          </select>
          <Button variant={favOnly ? "default" : "outline"} size="sm" onClick={() => setFavOnly(!favOnly)}><Star className="h-4 w-4" /> Favoris</Button>
          <Button onClick={create}><Plus className="h-4 w-4" /> Nouveau document</Button>
        </div>
        {docs === null ? <p className="text-muted-foreground">Chargement…</p> : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">Aucun document pour le moment.</p>
            <Button className="mt-4" onClick={create}><Plus className="h-4 w-4" /> Créer mon premier document</Button>
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {list.map((d) => (
              <li key={d.id} className="flex items-center gap-3 p-3">
                <button onClick={() => toggleFav(d)} aria-label="Favori"><Star className={`h-4 w-4 ${d.favorite ? "fill-gold text-gold" : "text-muted-foreground"}`} /></button>
                <Link to="/editeur/$id" params={{ id: d.id }} className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.id === d.category)?.label} · {d.word_count} mots · {new Date(d.updated_at).toLocaleDateString("fr-FR")}
                    {d.tags.length > 0 && " · " + d.tags.map((t) => "#" + t).join(" ")}
                  </p>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => remove(d)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
