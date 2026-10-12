import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { OrderDialog } from "@/components/OrderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { domains } from "@/lib/catalog";

import { BookPublication } from "@/components/BookPublication";
import { downloadBook, purchasable, type Book } from "@/lib/books";
import { useAuth } from "@/hooks/use-auth";
import { askAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/bibliotheque")({
  head: () => ({
    meta: [
      { title: "BERSA Library — Bibliothèque et assistant IA" },
      { name: "description", content: "Ouvrages classés par domaine et assistant IA pour orienter vos lectures et recherches." },
      { property: "og:title", content: "BERSA Library" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Bibliothèque par pôles disciplinaires avec assistant intelligent." },
    ],
  }),
  component: Page,
});

type Msg = { role: "user" | "assistant"; content: string };

function Assistant() {
  const { t } = useI18n();
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: q.trim() }];
    setMsgs(next);
    setQ("");
    setBusy(true);
    try {
      const r = await ask({ data: { messages: next } });
      setMsgs([...next, { role: "assistant", content: r.reply }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 font-display text-2xl font-bold">
        <Sparkles className="h-5 w-5 text-gold" /> {t("askAi")}
      </div>
      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "ml-8 bg-primary text-primary-foreground" : "mr-8 bg-muted"}`}>
            {m.content.replace(/\*\*/g, "")}
          </div>
        ))}
        {busy && <div className="mr-8 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">…</div>}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("askPlaceholder")} maxLength={2000} />
        <Button type="submit" disabled={busy} aria-label={t("send")}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}

function Page() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [owned, setOwned] = useState<Book[]>([]);
  const [paid, setPaid] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [reload, setReload] = useState(0);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  useEffect(() => {
    if (!user) return;
    void Promise.all([
      supabase.from("books").select("*").eq("status", "published").order("title"),
      supabase.from("books").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("book_id,paid").eq("user_id", user.id).not("book_id", "is", null),
    ]).then(async ([library, publications, orders]) => {
      setBooks(library.data ?? []); setOwned(publications.data ?? []);
      setPaid((orders.data ?? []).filter(o => o.paid && o.book_id).map(o => o.book_id ?? ""));
      setPending((orders.data ?? []).filter(o => !o.paid && o.book_id).map(o => o.book_id ?? ""));
      const urls: Record<string, string> = {};
      await Promise.all((library.data ?? []).filter(b => b.cover_path).map(async b => { if (!b.cover_path) return; const { data } = await supabase.storage.from("books").createSignedUrl(b.cover_path, 600); if (data) urls[b.id] = data.signedUrl; })); setCovers(urls);
    });
  }, [user, reload]);
  async function download(id: string) { try { await downloadBook(id); } catch (e) { toast.error(e instanceof Error ? e.message : "Téléchargement impossible."); } }
  const list = filter ? books.filter((b) => b.domain === filter) : books;
  return (
    <AppShell>
      <PageHeader title="Bibliothèque BERSA" subtitle={lang === "fr" ? "Des rayons par pôles disciplinaires et un assistant pour vous guider." : "Shelves by field and an assistant to guide you."} />
      <div className="mx-auto max-w-6xl px-4 pt-6"><BookPublication onSaved={() => setReload(n => n + 1)} />{owned.length > 0 && <section className="mt-5"><h2 className="text-2xl">Mes publications</h2><div className="divide-y">{owned.map(b => <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span>{b.title} · {b.status === "pending" ? "En attente de vérification" : b.status === "published" ? "Publié" : "Refusé"}</span>{b.file_path && <Button size="sm" variant="outline" onClick={() => void download(b.id)}>Mon fichier</Button>}</div>)}</div></section>}</div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filter ? "outline" : "default"} onClick={() => setFilter(null)}>{lang === "fr" ? "Tous" : "All"}</Button>
            {domains.map((d) => (
              <Button key={d.fr} size="sm" variant={filter === d.fr ? "default" : "outline"} onClick={() => setFilter(d.fr)}>
                {lang === "fr" ? d.fr : d.en}
              </Button>
            ))}
          </div>
          {list.length === 0 && <p className="mt-6 text-muted-foreground">Aucun ouvrage dans ce rayon pour le moment.</p>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {list.map((b) => (
              <div key={b.id} className="flex gap-3 rounded-xl border bg-card p-4">
                <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-royal-gradient text-gold">{covers[b.id] ? <img src={covers[b.id]} alt={`Couverture de ${b.title}`} className="h-full w-full object-contain" /> : <BookOpen className="h-5 w-5" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{b.title}</div>{b.subtitle && <p className="text-sm">{b.subtitle}</p>}
                  {b.author && <div className="text-sm">{b.author}</div>}
                  <div className="text-xs text-muted-foreground">{b.domain}</div>
                  {b.summary && <details className="mt-2 text-xs"><summary className="cursor-pointer">Résumé et détails</summary><p className="mt-1 whitespace-pre-wrap">{b.summary}</p><p>{b.publication_place} · {b.publisher} · {b.page_count ? `${b.page_count} pages` : ""}</p></details>}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-primary">{b.price_usd ? `${b.price_usd} ${b.currency}` : t("free")}</span>
                    {paid.includes(b.id) || b.user_id === user?.id || !b.price_usd ? <Button size="sm" onClick={() => void download(b.id)}>Télécharger</Button> : pending.includes(b.id) ? <span className="text-xs text-muted-foreground">Paiement en vérification</span> : purchasable(b) ? <OrderDialog kind="livre" item={b.title} bookId={b.id} price={b.price_usd} trigger={<Button size="sm" variant="outline">Acheter</Button>} /> : <span className="text-xs text-muted-foreground">Vente non disponible</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Assistant />
      </div>
      <span className="sr-only">{t("library")}</span>
    </AppShell>
  );
}
