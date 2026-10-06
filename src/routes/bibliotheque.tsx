import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { OrderDialog } from "@/components/OrderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { books, domains } from "@/lib/catalog";
import { askAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/bibliotheque")({
  head: () => ({
    meta: [
      { title: "BERSA Library — Bibliothèque et assistant IA" },
      { name: "description", content: "Ouvrages classés par domaine et assistant IA pour orienter vos lectures et recherches." },
      { property: "og:title", content: "BERSA Library" },
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
  const [filter, setFilter] = useState<string | null>(null);
  const list = filter ? books.filter((b) => b.domain === filter) : books;
  return (
    <AppShell>
      <PageHeader title="BERSA Library" subtitle={lang === "fr" ? "Des rayons par pôles disciplinaires et un assistant pour vous guider." : "Shelves by field and an assistant to guide you."} />
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {list.map((b) => (
              <div key={b.title} className="flex gap-3 rounded-xl border bg-card p-4">
                <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-royal-gradient text-gold"><BookOpen className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.domain}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-primary">{b.price ?? t("free")}</span>
                    {b.price && (
                      <OrderDialog kind="livre" item={b.title} price={parseFloat(b.price)} trigger={<Button size="sm" variant="outline">{t("order")}</Button>} />
                    )}
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
