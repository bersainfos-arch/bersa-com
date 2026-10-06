import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { domains } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Book = { id: string; title: string; author: string | null; domain: string; price_usd: number | null; file_path: string | null };

export function BookManager() {
  const [books, setBooks] = useState<Book[]>([]);
  const [busy, setBusy] = useState(false);
  const load = () =>
    supabase.from("books").select("id,title,author,domain,price_usd,file_path").order("created_at", { ascending: false })
      .then(({ data }) => setBooks((data as Book[]) ?? []));
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("file") as File | null;
    setBusy(true);
    let file_path: string | null = null;
    if (file && file.size > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      file_path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("books").upload(file_path, file, { contentType: file.type || undefined });
      if (error) { setBusy(false); toast.error(error.message); return; }
    }
    const price = String(f.get("price") || "").trim();
    const { error } = await supabase.from("books").insert({
      title: String(f.get("title")).trim().slice(0, 200),
      author: String(f.get("author") || "").trim().slice(0, 200) || null,
      domain: String(f.get("domain")),
      price_usd: price ? Number(price) : null,
      file_path,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Livre ajouté");
    form.reset();
    load();
  }

  async function remove(b: Book) {
    if (!confirm(`Supprimer « ${b.title} » ?`)) return;
    if (b.file_path) await supabase.storage.from("books").remove([b.file_path]);
    await supabase.from("books").delete().eq("id", b.id);
    load();
  }

  return (
    <section className="mt-8 rounded-2xl border bg-card p-5">
      <h2 className="text-2xl font-bold">Livres de la bibliothèque</h2>
      <form onSubmit={add} className="mt-4 grid gap-2 md:grid-cols-2">
        <Input name="title" placeholder="Titre" required maxLength={200} />
        <Input name="author" placeholder="Auteur" maxLength={200} />
        <select name="domain" className="h-9 rounded-md border bg-background px-3 text-sm" required>
          {domains.map((d) => <option key={d.fr} value={d.fr}>{d.fr}</option>)}
        </select>
        <Input name="price" type="number" min="0" step="0.01" placeholder="Prix en $ (vide = accès libre)" />
        <Input name="file" type="file" accept=".pdf,.epub,application/pdf" className="md:col-span-2" />
        <Button type="submit" disabled={busy} className="md:col-span-2">{busy ? "Envoi…" : "Ajouter le livre"}</Button>
      </form>
      <div className="mt-4 divide-y">
        {books.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div>
              <b>{b.title}</b>{b.author ? ` — ${b.author}` : ""} · {b.domain} · {b.price_usd ? `${b.price_usd} $` : "Libre"}{b.file_path ? " · 📄" : ""}
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(b)} aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </section>
  );
}
