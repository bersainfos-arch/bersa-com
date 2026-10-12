import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookPublication } from "@/components/BookPublication";
import { downloadBook } from "@/lib/books";

type Book = { id: string; title: string; author: string | null; domain: string; price_usd: number | null; file_path: string | null; status: string; summary: string };

export function BookManager() {
  const [books, setBooks] = useState<Book[]>([]);
  const load = () =>
    supabase.from("books").select("id,title,author,domain,price_usd,file_path,status,summary").order("created_at", { ascending: false })
      .then(({ data }) => setBooks((data as Book[]) ?? []));
  useEffect(() => { load(); }, []);

  async function review(id: string, status: "published" | "refused") {
    if (!confirm(status === "published" ? "Publier ce livre après vérification de son contenu et de ses droits ?" : "Refuser cette publication ?")) return;
    const { error } = await supabase.from("books").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Publication mise à jour"); load(); }
  }
  async function remove(b: Book) {
    if (!confirm(`Supprimer « ${b.title} » ?`)) return;
    const { error } = await supabase.from("books").delete().eq("id", b.id);
    if (error) { toast.error(error.message); return; }
    if (b.file_path) await supabase.storage.from("books").remove([b.file_path]);
    load();
  }

  return (
    <section className="mt-8 rounded-2xl border bg-card p-5">
      <h2 className="text-2xl font-bold">Livres de la bibliothèque</h2>
      <div className="mt-4"><BookPublication onSaved={() => { load(); }} /></div>
      <div className="mt-4 divide-y">
        {books.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div>
              <b>{b.title}</b> · {b.status === "pending" ? "En attente" : b.status === "published" ? "Publié" : "Refusé"}{b.author ? ` — ${b.author}` : ""} · {b.domain} · {b.price_usd ? `${b.price_usd} $` : "Libre"}{b.file_path ? " · 📄" : ""}
              {b.summary && <details><summary>Résumé</summary><p className="whitespace-pre-wrap">{b.summary}</p></details>}
            </div>
            <div className="flex flex-wrap gap-1">{b.status === "pending" && <><Button size="sm" onClick={() => void review(b.id, "published")}>Publier</Button><Button size="sm" variant="outline" onClick={() => void review(b.id, "refused")}>Refuser</Button></>}{b.file_path && <Button size="sm" variant="outline" onClick={async () => { try { await downloadBook(b.id); } catch (e) { toast.error(e instanceof Error ? e.message : "Fichier indisponible"); } }}>Examiner</Button>}<Button size="sm" variant="ghost" onClick={() => remove(b)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button></div>
          </div>
        ))}
      </div>
    </section>
  );
}
