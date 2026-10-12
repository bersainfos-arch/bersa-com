import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Wand2, SpellCheck, Repeat, Expand, AlignLeft, Star, ArrowRight, ListTree, Lightbulb,
  Languages, FileUser, BookMarked, GraduationCap, MessagesSquare, Copy, Volume2, Mic,
  RotateCcw, Trash2, Loader2, Send, CircleAlert, X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { runWriter } from "@/lib/writer.functions";
import { PlanQuickList } from "@/components/PlanQuickList";
import { QuotaMeter, useDailyQuota } from "@/components/QuotaMeter";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Assistant IA de rédaction — BERSA" },
      { name: "description", content: "Rédiger, corriger, résumer, traduire, faire un plan ou un CV avec l'assistant IA BERSA." },
      { property: "og:title", content: "Assistant IA de rédaction — BERSA" },
      { property: "og:description", content: "13 outils d'écriture assistée par IA pour étudiants, chercheurs et professionnels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const actions = [
  { id: "chat", label: "Discussion", icon: MessagesSquare },
  { id: "generate", label: "Générer", icon: Wand2 },
  { id: "correct", label: "Corriger", icon: SpellCheck },
  { id: "rephrase", label: "Reformuler", icon: Repeat },
  { id: "expand", label: "Développer", icon: Expand },
  { id: "summarize", label: "Résumer", icon: AlignLeft },
  { id: "improve", label: "Améliorer", icon: Star },
  { id: "continue", label: "Continuer", icon: ArrowRight },
  { id: "outline", label: "Plan", icon: ListTree },
  { id: "suggest", label: "Suggestions", icon: Lightbulb },
  { id: "translate", label: "Traduire", icon: Languages },
  { id: "cv", label: "CV", icon: FileUser },
  { id: "references", label: "Références", icon: BookMarked },
  { id: "academic", label: "Académique", icon: GraduationCap },
] as const;

type Msg = { role: "user" | "assistant"; content: string; action?: string };
const KEY = "bersa-assistant-history";

function Page() {
  const ask = useServerFn(runWriter);
  const { quota: daily, setQuota: setDaily } = useDailyQuota();
  const [action, setAction] = useState<string>("chat");
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const [warn, setWarn] = useState<{ remaining: number; limit: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { setMsgs(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  function save(next: Msg[]) {
    const trimmed = next.slice(-40);
    setMsgs(trimmed);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  }

  async function send(history: Msg[], act: string) {
    setBusy(true);
    try {
      const ctx = act === "chat" ? history : history.slice(-1);
      const r = await ask({ data: { action: act, messages: ctx.map(({ role, content }) => ({ role, content })) } });
      save([...history, { role: "assistant", content: r.reply }]);
      setDaily({ used: r.used, limit: r.limit });
      const remaining = r.limit - r.used;
      if (remaining > 0 && remaining <= Math.max(3, Math.ceil(r.limit * 0.2))) {
        setWarn({ remaining, limit: r.limit });
      } else {
        setWarn(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      const m = msg.match(/QUOTA_EXHAUSTED.*\((\d+)\/(\d+)\)/);
      if (m) {
        setQuota({ used: Number(m[1]), limit: Number(m[2]) });
      } else {
        toast.error(msg);
      }
      save(history);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: text.trim(), action }];
    setText("");
    save(next);
    void send(next, action);
  }

  function regenerate() {
    const lastUser = msgs.map((m) => m.role).lastIndexOf("user");
    if (lastUser < 0 || busy) return;
    const hist = msgs.slice(0, lastUser + 1);
    save(hist);
    void send(hist, hist[lastUser]?.action ?? "chat");
  }

  function speak(t: string): void {
    if (!("speechSynthesis" in window)) { toast.error("Lecture audio non disponible sur cet appareil."); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "fr-FR";
    speechSynthesis.speak(u);
  }

  function dictate(): void {
    const W = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) { toast.error("Dictée vocale non disponible sur ce navigateur (essayez Chrome)."); return; }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.onresult = (e: any) => setText((p) => (p ? p + " " : "") + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const label = (id?: string) => actions.find((a) => a.id === id)?.label;

  return (
    <AppShell>
      <PageHeader title="Assistant IA" subtitle="Rédigez, corrigez, résumez, traduisez ou discutez avec BERSA." />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <QuotaMeter quota={daily} />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setAction(a.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition ${
                action === a.id ? "border-gold bg-gold/15 font-semibold text-primary" : "bg-card hover:border-gold/60"
              }`}
            >
              <a.icon className="h-5 w-5" />
              {a.label}
            </button>
          ))}
        </div>

        {warn && !quota && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 p-4">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Quota bientôt épuisé</p>
              <p className="mt-1 text-muted-foreground">
                Il vous reste {warn.remaining} conversation{warn.remaining > 1 ? "s" : ""} sur {warn.limit} aujourd'hui.
                Le quota se renouvelle demain ; pour un volume plus important, choisissez une formule supérieure.
              </p>
              <PlanQuickList />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/abonnements">Voir les abonnements</Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setWarn(null)}>
                  <X className="mr-1 h-4 w-4" /> Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {quota && (
          <div className="mt-6 rounded-2xl border border-gold/60 bg-gold/10 p-4">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">Limite quotidienne atteinte</p>
                <p className="mt-1 text-muted-foreground">
                  Vous avez utilisé {quota.used} conversation{quota.used > 1 ? "s" : ""} sur {quota.limit} aujourd'hui.
                  Votre quota se renouvelle demain. Pour continuer sans attendre, choisissez une formule supérieure :
                </p>
                <PlanQuickList />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
                    <Link to="/abonnements">Voir les abonnements</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setQuota(null)}>
                    <X className="mr-1 h-4 w-4" /> Plus tard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {msgs.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Choisissez un outil, écrivez votre texte ou votre sujet, puis touchez Envoyer. En mode Discussion, BERSA se souvient de la conversation.
            </p>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              {m.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                  {m.action && m.action !== "chat" && (
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-gold">{label(m.action)}</span>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copié"); }}>
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copier
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => speak(m.content)}>
                      <Volume2 className="mr-1 h-3.5 w-3.5" /> Écouter
                    </Button>
                    {i === msgs.length - 1 && (
                      <Button size="sm" variant="ghost" onClick={regenerate} disabled={busy}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Régénérer
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> BERSA rédige…
            </p>
          )}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-20 mt-6 rounded-2xl border bg-card p-3 shadow-soft md:bottom-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 15000))}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(); }}
            placeholder={`${label(action)} : écrivez votre texte ou votre demande…`}
            rows={4}
            className="border-0 shadow-none focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={dictate} disabled={listening}>
              <Mic className={`mr-1 h-4 w-4 ${listening ? "animate-pulse text-destructive" : ""}`} />
              {listening ? "J'écoute…" : "Dicter"}
            </Button>
            {msgs.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => save([])}>
                <Trash2 className="mr-1 h-4 w-4" /> Effacer
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{text.length}/15000</span>
            <Button size="sm" onClick={submit} disabled={busy || !text.trim()} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Send className="mr-1 h-4 w-4" /> Envoyer
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
