import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Repeat, ListTree, Expand, AlignLeft, SpellCheck, Star, BookMarked, Languages, Lightbulb, Send, Loader2, Copy, FilePlus2, Bold, Italic, Underline, List, ListOrdered, AlignCenter, AlignRight, AlignJustify, Undo2, Redo2, Table, Link2, Eraser } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { runWriter } from "@/lib/writer.functions";
import { QuotaMeter, useDailyQuota } from "@/components/QuotaMeter";

const ACTIONS = [
  { id: "rephrase", label: "Reformuler", icon: Repeat },
  { id: "outline", label: "Plan", icon: ListTree },
  { id: "expand", label: "Développer", icon: Expand },
  { id: "summarize", label: "Résumer", icon: AlignLeft },
  { id: "correct", label: "Corriger", icon: SpellCheck },
  { id: "improve", label: "Améliorer", icon: Star },
  { id: "references", label: "Source", icon: BookMarked },
  { id: "translate", label: "Traduire", icon: Languages },
  { id: "suggest", label: "Suggestions", icon: Lightbulb },
] as const;

export function HomeEditor() {
  const nav = useNavigate();
  const ask = useServerFn(runWriter);
  const { quota, setQuota } = useDailyQuota();
  const [action, setAction] = useState<string>("rephrase");
  const [tab, setTab] = useState<"accueil" | "insertion" | "ia">("ia");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const cmd = (c: string, v?: string) => { sheet.current?.focus(); document.execCommand(c, false, v); };

  async function run() {
    const text = sheet.current?.innerText.trim() ?? "";
    if (!text) { toast.error("Saisissez un texte."); return; }
    setBusy(true);
    try {
      const r = await ask({ data: { action, messages: [{ role: "user", content: text }] } });
      setReply(r.reply);
      setQuota({ used: r.used, limit: r.limit });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      toast.error(msg.startsWith("QUOTA_EXHAUSTED") ? "Limite quotidienne atteinte — consultez les abonnements." : msg);
    } finally {
      setBusy(false);
    }
  }

  async function createDoc(title: string, category: string, content: string) {
    const { data, error } = await supabase.from("user_docs").insert({ title, category, content }).select("id").single();
    if (error) { toast.error(error.message); return; }
    nav({ to: "/editeur/$id", params: { id: data.id } });
  }

  const Rb = ({ icon: I, label, onClick }: { icon: typeof Bold; label: string; onClick: () => void }) => (
    <Button variant="ghost" size="icon" type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded px-2 py-1 text-[11px] hover:bg-muted">
      <I className="h-4 w-4" />
    </Button>
  );

  return (<AppShell><section aria-label="Assistant IA — éditeur Word" className="mx-auto max-w-6xl px-3 py-4">
          <div className="flex items-center gap-1 bg-primary px-3 pt-2 text-primary-foreground">
            {([["accueil", "Accueil"], ["insertion", "Insertion"], ["ia", "IA BERSA"]] as const).map(([id, l]) => (
              <Button variant="ghost" key={id} onClick={() => setTab(id)} className={`rounded-t-md px-4 py-1.5 text-sm ${tab === id ? "bg-card text-foreground font-semibold" : "opacity-80 hover:opacity-100"}`}>{l}</Button>
            ))}

          </div>
          <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
            {tab === "accueil" && <>
              <Rb icon={Undo2} label="Annuler" onClick={() => cmd("undo")} />
              <Rb icon={Redo2} label="Rétablir" onClick={() => cmd("redo")} />
              <Rb icon={Bold} label="Gras" onClick={() => cmd("bold")} />
              <Rb icon={Italic} label="Italique" onClick={() => cmd("italic")} />
              <Rb icon={Underline} label="Souligné" onClick={() => cmd("underline")} />
              <Rb icon={List} label="Puces" onClick={() => cmd("insertUnorderedList")} />
              <Rb icon={ListOrdered} label="Numéros" onClick={() => cmd("insertOrderedList")} />
              <Rb icon={AlignLeft} label="Gauche" onClick={() => cmd("justifyLeft")} />
              <Rb icon={AlignCenter} label="Centrer" onClick={() => cmd("justifyCenter")} />
              <Rb icon={AlignRight} label="Droite" onClick={() => cmd("justifyRight")} />
              <Rb icon={AlignJustify} label="Justifier" onClick={() => cmd("justifyFull")} />
              <Rb icon={Eraser} label="Effacer format" onClick={() => cmd("removeFormat")} />
            </>}
            {tab === "insertion" && <>
              <Rb icon={Table} label="Tableau" onClick={() => cmd("insertHTML", '<table border="1" style="border-collapse:collapse;width:100%"><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p></p>')} />
              <Rb icon={Link2} label="Lien" onClick={() => { const u = prompt("Adresse du lien"); if (u) cmd("createLink", u); }} />
              <Rb icon={FilePlus2} label="Nouveau document" onClick={() => createDoc("Nouveau document", "general", sheet.current?.innerHTML || "<p></p>")} />
            </>}
            {tab === "ia" && ACTIONS.map((a) => (
              <Button variant="ghost" key={a.id} onClick={() => setAction(a.id)}
                className={`flex flex-col items-center gap-0.5 rounded px-2 py-1 text-[11px] ${action === a.id ? "bg-gold text-gold-foreground font-semibold" : "hover:bg-muted"}`}>
                <a.icon className="h-4 w-4" /> {a.label}
              </Button>
            ))}
          </div>
          <div className="space-y-3 bg-muted/40 p-4">
            <div ref={sheet} contentEditable suppressContentEditableWarning
              role="textbox" aria-label="Texte à rédiger" aria-multiline="true"
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
              data-placeholder="Écrivez votre demande ou votre texte…"
              className="a4-page home-ai-sheet mx-auto" />
            {reply && (
              <div className="mx-auto max-w-[794px] rounded-xl border bg-card p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(reply); toast.success("Copié"); }}><Copy className="mr-1 h-4 w-4" /> Copier</Button>
                  <Button size="sm" variant="outline" onClick={() => { if (sheet.current) sheet.current.innerText = reply; }}><Repeat className="mr-1 h-4 w-4" /> Remplacer le texte</Button>
                  <Button size="sm" variant="outline" onClick={() => createDoc("Texte assisté", "general", reply.split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join(""))}><FilePlus2 className="mr-1 h-4 w-4" /> Ouvrir dans un document</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-card px-4 py-3">
            <div className="min-w-0 flex-1"><QuotaMeter quota={quota} /></div>
            <Button onClick={run} disabled={busy} aria-label="Envoyer la commande IA">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {busy ? "En cours…" : "Envoyer"}
            </Button>
          </div>
  </section></AppShell>);
}
