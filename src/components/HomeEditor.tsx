import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Highlight from "@tiptap/extension-highlight";
import { toast } from "sonner";
import { Send, Loader2, Mic, Square, Trash2, X, FileAudio } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { EditorRibbon, type PageSettings } from "@/components/EditorRibbon";
import { supabase } from "@/integrations/supabase/client";
import { useDailyQuota } from "@/components/QuotaMeter";
import { PlanQuickList } from "@/components/PlanQuickList";
import { assistantActions, writingTarget } from "@/lib/assistant-actions";
import { readAttachment, type Attachment } from "@/lib/attachments";
import { recordWav } from "@/lib/record-wav";
import { Footnote, collectFootnotes, renumberFootnotes, updateFootnote, deleteFootnote, type FootnoteItem } from "@/lib/footnotes";
import { createParser } from "eventsource-parser";

const PageBreak = Node.create({ name: "pageBreak", group: "block", atom: true, parseHTML: () => [{ tag: "div.page-break" }], renderHTML: () => ["div", { class: "page-break" }] });
const paragraphs = (text: string) => text.split(/\n/).map(line => ({ type: "paragraph", ...(line ? { content: [{ type: "text", text: line }] } : {}) }));

export function HomeEditor() {
  const nav = useNavigate();
  const { quota, setQuota } = useDailyQuota();
  const [action, setAction] = useState("generate");
  const [tab, setTab] = useState("Assistant");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PageSettings>({ margin: "Normales", orientation: "Portrait", format: "A4", zoom: "100%", ruler: false, watermark: "", lineNumbers: false, viewMode: "page", headerText: "", footerText: "" });
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef<Awaited<ReturnType<typeof recordWav>> | null>(null);
  const [footnotes, setFootnotes] = useState<FootnoteItem[]>([]);
    // Historique des demandes posées à l'Assistant
  const [history, setHistory] = useState<{ id: string; prompt: string; action: string; time: string }[]>([]);
  // Décalage pour remonter la capsule au-dessus du clavier virtuel mobile
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const updateOffset = () => {
      const offset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setKeyboardOffset(offset);
    };
    vv.addEventListener("resize", updateOffset);
    vv.addEventListener("scroll", updateOffset);
    return () => {
      vv.removeEventListener("resize", updateOffset);
      vv.removeEventListener("scroll", updateOffset);
    };
  }, []);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ["heading", "paragraph"] }), Image.configure({ allowBase64: true }), Table.configure({ resizable: true }), TableRow, TableCell, TableHeader, Highlight.configure({ multicolor: true }), PageBreak, Footnote],
    content: "<p></p>",
    onUpdate: ({ editor: e }) => {
      renumberFootnotes(e);
      setFootnotes(collectFootnotes(e));
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Texte à rédiger",
        "aria-multiline": "true",
        class: "a4-page home-ai-sheet",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const request = sessionStorage.getItem("bersa-writing-request");
    if (request) {
      editor.commands.setContent(paragraphs(request));
      sessionStorage.removeItem("bersa-writing-request");
    }
  }, [editor]);

  useEffect(() => {
    if (!audio) { setAudioUrl(""); return; }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  useEffect(() => () => { void recorder.current?.stop().catch(() => {}); }, []);

  // Restauration automatique du brouillon précédent au démarrage
  useEffect(() => {
    if (!editor) return;
    const savedDraft = localStorage.getItem("bersa_current_draft");
    if (savedDraft && !editor.getText().trim()) {
      try {
        editor.commands.setContent(JSON.parse(savedDraft));
      } catch {
        /* ignorer si format invalide */
      }
    }
  }, [editor]);

  // Sauvegarde automatique du document en cours
  useEffect(() => {
    if (!editor) return;
    const saveTimer = setInterval(() => {
      if (editor.getText().trim()) {
        localStorage.setItem("bersa_current_draft", JSON.stringify(editor.getJSON()));
      }
    }, 2000);
    return () => clearInterval(saveTimer);
  }, [editor]);

  // Navigation fluide entre l'appel et la note
  const scrollToTarget = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/20", "transition-colors");
      setTimeout(() => {
        el.classList.remove("bg-primary/20");
      }, 1500);
    }
  };

  async function run(chosen = action) {
    if (!editor || busy) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    const text = writingTarget(editor.getText(), { from, to, text: selected }).trim();
    if (!text) { toast.error("Écrivez votre demande sur le papier."); return; }
    if (files.some(file => file.type === "other")) { toast.info("Les pièces jointes non analysables ne sont pas transmises à l’Assistant."); }
    setBusy(true); setError(""); editor.setEditable(false);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Connectez-vous pour rédiger.");
            setHistory(prev => [
        {
          id: String(Date.now()),
          prompt: text.length > 120 ? text.slice(0, 120) + "…" : text,
          action: chosen,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev.slice(0, 9), // conserve les 10 dernières demandes
      ]);
      const response = await fetch("/api/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ action: chosen, text, attachments: files.filter(f => f.type !== "other") }),
      });
      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("Réponse vide.");
      const original = editor.getJSON();
      let reply = "", failure = "", lastPaint = 0;
      const replaceSelection = from !== to && selected.trim();
      const paint = () => {
        if (!reply) return;
        editor.commands.setContent(original);
        if (replaceSelection) editor.chain().setTextSelection({ from, to }).insertContent(paragraphs(reply)).run();
        else editor.commands.setContent(paragraphs(reply));
      };
      const parser = createParser({
        onEvent(event) {
          try {
            const item = JSON.parse(event.data);
            if (item.type === "quota") setQuota({ used: item.used, limit: item.limit });
            if (item.type === "delta") {
              reply += item.text;
              if (performance.now() - lastPaint > 100) { paint(); lastPaint = performance.now(); }
            }
            if (item.type === "error") failure = item.message;
          } catch {}
        },
      });
      const reader = response.body.getReader(), decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        parser.feed(decoder.decode(chunk.value, { stream: true }));
      }
      paint();
      if (failure) throw new Error(failure);
      if (!reply.trim()) throw new Error("L’Assistant n’a pas produit de texte.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Assistant indisponible.";
      setError(message);
      const match = message.match(/QUOTA_EXHAUSTED.*\((\d+)\/(\d+)\)/);
      if (match) setQuota({ used: Number(match[1]), limit: Number(match[2]) });
    } finally {
      setBusy(false);
      editor.setEditable(settings.viewMode !== "lecture");
    }
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list).slice(0, Math.max(0, 3 - files.length))) {
      try {
        const attachment = await readAttachment(file);
        setFiles(previous => [...previous, attachment]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fichier illisible.");
      }
    }
  }

  async function save() {
    if (!editor) return;
    const title = prompt("Titre du document", "Texte assisté");
    if (!title) return;
    const { data, error: issue } = await supabase.from("user_docs").insert({
      title: title.slice(0, 200),
      category: "general",
      content: editor.getHTML(),
      word_count: editor.getText().trim().split(/\s+/).filter(Boolean).length,
    }).select("id").single();
    if (issue || !data) { toast.error(issue?.message ?? "Sauvegarde impossible."); return; }
    nav({ to: "/editeur/$id", params: { id: data.id } });
  }

  async function toggleRecord() {
    try {
      if (recording && recorder.current) {
        const recorded = await recorder.current.stop();
        setAudio(recorded);
        recorder.current = null;
        setRecording(false);
        await transcribeAudio(recorded);
      } else {
        recorder.current = await recordWav();
        setRecording(true);
      }
    } catch {
      setRecording(false);
      toast.error("Microphone refusé ou indisponible. Autorisez l’enregistrement dans votre navigateur.");
    }
  }

  async function transcribeAudio(recorded = audio) {
    if (!recorded || !editor) return;
    setTranscribing(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Connectez-vous pour transcrire.");
      const form = new FormData();
      form.append("file", recorded);
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        body: form,
      });
      if (!response.ok) {
        const problem = await response.text();
        throw new Error(problem || "Transcription indisponible.");
      }
      if (!response.body) throw new Error("Transcription vide.");
      let transcript = "";
      let failure = "";
      const parser = createParser({
        onEvent(event) {
          if (event.data === "[DONE]") return;
          try {
            const item = JSON.parse(event.data);
            if (item.type === "transcript.text.delta") transcript += item.delta ?? "";
            if (item.type === "transcript.text.done") transcript = item.text ?? transcript;
            if (item.type === "error") failure = item.message ?? item.error?.message ?? "Transcription interrompue.";
          } catch {}
        },
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        parser.feed(decoder.decode(chunk.value, { stream: true }));
      }
      if (failure) throw new Error(failure);
      if (!transcript.trim()) throw new Error("Aucune parole reconnue.");
      editor.chain().focus().insertContent(paragraphs(transcript)).run();
      await run("generate");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transcription impossible.");
    } finally {
      setTranscribing(false);
    }
  }

  const remaining = quota ? Math.max(0, quota.limit - quota.used) : null;
  const [totalPages, setTotalPages] = useState(1);

  // Pagination dynamique par mesure géométrique réelle de la hauteur du contenu
  useEffect(() => {
    if (!editor?.view?.dom) return;
    const dom = editor.view.dom as HTMLElement;
    const updatePages = () => {
      const isMobile = window.innerWidth <= 640;
      // Hauteur calibrée pour contenir une vraie page dense Word (~3 200 caractères)
      const pageHeight = isMobile ? 780 : 1100;
      const contentHeight = dom.scrollHeight || dom.clientHeight;
      const count = Math.max(1, Math.ceil(contentHeight / pageHeight));
      setTotalPages(count);
    };
    updatePages();
    const observer = new ResizeObserver(updatePages);
    observer.observe(dom);
    window.addEventListener("resize", updatePages);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePages);
    };
  }, [editor]);

  return (
    <AppShell>
      <section aria-label="Assistant — éditeur Word" className="home-editor mx-auto max-w-6xl px-1 py-1 sm:px-4">
        <EditorRibbon
          editor={editor}
          tab={tab}
          setTab={setTab}
          settings={settings}
          setSettings={setSettings}
          attach={() => fileInput.current?.click()}
          save={() => void save()}
          correct={() => { setAction("correct"); void run("correct"); }}
        />

        {tab === "Assistant" && (
          <div className="no-print flex items-center gap-1 overflow-x-auto border-b bg-card px-2 py-1 scrollbar-none" aria-label="Services de l’Assistant">
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">A4</span>
            {assistantActions.filter(([id]) => !["generate", "cv", "academic"].includes(id)).map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant="ghost"
                className="h-7 shrink-0 px-2 text-xs"
                onMouseDown={e => e.preventDefault()}
                disabled={busy || transcribing || recording}
                onClick={() => { setAction("generate"); void run(id); }}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        <input ref={fileInput} type="file" multiple className="hidden" onChange={e => { void addFiles(e.target.files); e.target.value = ""; }} />

        {tab === "Insérer" && (
          <p className="no-print px-2 py-1 text-[11px] text-muted-foreground">
            3 fichiers, 5 Mo chacun · Analyse : texte, PDF, Word (.docx), images PNG/JPEG/WebP.
          </p>
        )}

        {files.length > 0 && (
          <div className="no-print flex gap-1 overflow-x-auto py-1">
            {files.map((f, i) => (
              <span key={`${f.name}-${i}`} className="flex shrink-0 items-center gap-1 border bg-card pl-2 text-xs">
                {f.name}{f.type === "other" && " · non analysable"}
                <Button size="icon" variant="ghost" aria-label={`Retirer ${f.name}`} onClick={() => setFiles(files.filter((_, n) => n !== i))}>
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
        )}

        <div
          className={`home-paper-desk a4-desk margin-${settings.margin} orientation-${settings.orientation} format-${settings.format} zoom-${settings.zoom.replace("%", "")}`}
          onClick={e => {
            const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a.footnote-link, a.a4-footnote-backlink");
            if (anchor) {
              const hash = anchor.getAttribute("href");
              if (hash && hash.startsWith("#")) {
                e.preventDefault();
                scrollToTarget(hash.slice(1));
              }
            }
          }}
        >
          {settings.ruler && <div className="no-print editor-ruler mx-auto max-w-[794px]">0 ┆ 1 ┆ 2 ┆ 3 ┆ 4 ┆ 5 ┆ 6 ┆ 7 ┆ 8 ┆ 9 ┆ 10</div>}
          <EditorContent editor={editor} className="home-paper-content" />

          {footnotes.length > 0 && (
            <div className="a4-footnotes mx-auto max-w-[794px]" aria-label="Notes de bas de page">
              <hr className="a4-footnotes-rule" />
              <ol className="a4-footnotes-list">
                {footnotes.map(fn => (
                  <li key={fn.pos} id={`fn-${fn.number}`} className="a4-footnote-item scroll-mt-24">
                    <a
                      href={`#fnref-${fn.number}`}
                      className="a4-footnote-backlink inline-flex items-center text-primary font-semibold hover:underline"
                      title="Retourner à l'appel de note dans le texte"
                      aria-label={`Retourner à l'appel de note ${fn.number}`}
                      onClick={e => {
                        e.preventDefault();
                        scrollToTarget(`fnref-${fn.number}`);
                      }}
                    >
                      <sup className="a4-footnote-number mr-1">{fn.number} ↩</sup>
                    </a>
                    <span className="a4-footnote-text">{fn.note}</span>
                    <button
                      type="button"
                      className="no-print a4-footnote-action"
                      aria-label={`Modifier la note ${fn.number}`}
                      onClick={() => {
                        const text = prompt("Modifier la note :", fn.note);
                        if (text && editor) updateFootnote(editor, fn.pos, text);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="no-print a4-footnote-action"
                      aria-label={`Supprimer la note ${fn.number}`}
                      onClick={() => {
                        if (editor) deleteFootnote(editor, fn.pos);
                      }}
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Pied de page numéroté automatique */}
          <div className="no-print mx-auto mt-4 flex w-full max-w-[794px] items-center justify-between border-t border-border/40 px-3 pt-2 text-[11px] text-muted-foreground">
            <span>{settings.format} · Marges {settings.margin}</span>
            <span className="font-semibold text-primary">
              Page 1 sur {totalPages} ({totalPages === 1 ? "1 feuille A4" : `${totalPages} feuilles A4`})
            </span>
          </div>
        </div>

        {/* Boutons flottants persistants (mobile et ordinateur) style capsule, sans masquer la feuille */}
        <div className="no-print fixed right-4 bottom-5 z-40 flex items-center gap-2 rounded-full border border-border/80 bg-card/95 p-1.5 shadow-2xl backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-muted"
            aria-label={recording ? "Arrêter l’enregistrement" : "Enregistrer une consigne audio"}
            title={recording ? "Arrêter l’enregistrement" : "Consigne audio"}
            onClick={() => void toggleRecord()}
            disabled={transcribing || busy}
          >
            {recording ? <Square className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4 text-primary" />}
          </Button>

          <Button
            size="sm"
            className="h-10 rounded-full px-4 font-medium shadow-md gap-2"
            onClick={() => void run()}
            disabled={busy || recording || transcribing}
            aria-label="Envoyer la commande IA"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">{busy ? "Rédaction…" : "Envoyer"}</span>
          </Button>

          <div className="h-6 w-[1px] bg-border/80" />

          <Link
            to="/abonnements"
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
            title={quota ? `${remaining} conversations restantes sur ${quota.limit}` : "Formules d'abonnement"}
          >
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold">
              {remaining !== null ? `${remaining}` : "0"}
            </span>
            <span className="hidden md:inline">Abonnement</span>
          </Link>
        </div>

        {audioUrl && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <audio controls src={audioUrl} className="h-9 min-w-0 max-w-full flex-1" />
            <Button size="sm" variant="outline" onClick={() => void transcribeAudio()} disabled={transcribing}>
              <FileAudio className="h-4 w-4" />{transcribing ? "Transcription…" : "Transcrire"}
            </Button>
            <Button size="icon" variant="ghost" aria-label="Supprimer l’audio" onClick={() => setAudio(null)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-2 border border-destructive p-3 text-sm text-destructive">
            {error.startsWith("QUOTA_EXHAUSTED") ? `Limite quotidienne atteinte : ${quota?.used}/${quota?.limit} utilisées. Renouvellement à 00:00 UTC.` : error}
          </div>
        )}

        {quota && remaining !== null && remaining <= Math.max(3, Math.ceil(quota.limit * 0.2)) && (
          <details className="mt-2 border p-2 text-xs">
            <summary className="cursor-pointer">
              {remaining === 0 ? "Limite atteinte" : `${remaining} conversations restantes`} · Options d’abonnement
            </summary>
            <PlanQuickList />
          </details>
        )}
      </section>
    </AppShell>
  );
}
