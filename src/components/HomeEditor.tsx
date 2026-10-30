import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Highlight from "@tiptap/extension-highlight";
import { toast } from "sonner";
import { Send, Loader2, Mic, Square, Trash2, X, FileAudio, Paperclip, RotateCcw, Sparkles, ChevronDown, ChevronUp, History, PenTool, Copy, Check, FileDown, Plus, Save, Download, Folder } from "lucide-react";
import { HomeMessagesModal } from "@/components/HomeMessagesModal";
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

export function HomeEditor({ embedded = false }: { embedded?: boolean }) {
  const nav = useNavigate();
  const { quota, setQuota } = useDailyQuota();
  const [action, setAction] = useState("generate");
  const [tab, setTab] = useState(embedded ? "Mise en forme" : "Assistant");
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
    const [promptInput, setPromptInput] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  // Historique des demandes posées à l'Assistant
  const [history, setHistory] = useState<Array<{ id: string; prompt: string; action: string; time: string }>>([]);
  // Décalage pour remonter la capsule au-dessus du clavier virtuel mobile
  const [keyboardOffset, setKeyboardOffset] = useState(0);
    // Affichage aéré et épuré (sans encombrement)
    const [ribbonOpen, setRibbonOpen] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
    const [showAssistantBar, setShowAssistantBar] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [showResultCard, setShowResultCard] = useState(false);
  const [copied, setCopied] = useState(false);
    // Gestion de l'enregistrement Word/PDF et dossier mobile
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [docFileName, setDocFileName] = useState("Mon_Document_BERSA");
  const [exportFormat, setExportFormat] = useState<"docx" | "pdf" | "txt">("docx");
  const [targetFolder, setTargetFolder] = useState("downloads");
  const Frame = embedded ? Fragment : AppShell;
  useEffect(() => {
    const updateOffset = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      // Calcul universel : écart entre la hauteur totale et la zone visible actuelle
      const layoutHeight = window.innerHeight;
      const visibleBottom = vv.height + vv.offsetTop;
      const rawOffset = Math.max(0, layoutHeight - visibleBottom);

      // Seuil de 120px pour ignorer le masquage mineur des barres de navigation
      if (rawOffset > 120 || vv.height < layoutHeight * 0.78) {
        setKeyboardOffset(rawOffset);
      } else {
        setKeyboardOffset(0);
      }
    };

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateOffset);
      vv.addEventListener("scroll", updateOffset);
    }
    window.addEventListener("scroll", updateOffset);

    // Suivi dynamique pendant l'animation d'ouverture du clavier lors du toucher dans le texte
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(".home-ai-sheet, input, textarea, [contenteditable]")) {
        let attempts = 0;
        const interval = setInterval(() => {
          updateOffset();
          attempts++;
          if (attempts > 10) clearInterval(interval);
        }, 40);
      }
    };

    const onFocusOut = () => {
      setTimeout(updateOffset, 150);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateOffset);
        vv.removeEventListener("scroll", updateOffset);
      }
      window.removeEventListener("scroll", updateOffset);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
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
    const assistantPrompt = sessionStorage.getItem("bersa-assistant-prompt");
    if (assistantPrompt) {
      setPromptInput(assistantPrompt);
      setShowAssistantBar(true);
      sessionStorage.removeItem("bersa-assistant-prompt");
    }
  }, []);
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
  // Analyse des pièces jointes
  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    for (const file of Array.from(list).slice(0, Math.max(0, 3 - files.length))) {
      try {
        const attachment = await readAttachment(file);
        setFiles((previous) => [...previous, attachment]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fichier illisible.");
      }
    }
  };
  // Insertion dans le papier : disparaît d'un coup dès que le texte est inséré
  const insertIntoPaper = (mode: "auto" | "append" | "replace" = "auto") => {
    if (!editor || !generatedResponse.trim()) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    const hasSelection = from !== to && selected.trim();

    if (mode === "replace" || (mode === "auto" && hasSelection)) {
      editor.chain().focus().setTextSelection({ from, to }).insertContent(paragraphs(generatedResponse)).run();
      toast.success("Texte inséré avec succès.");
    } else if (editor.getText().trim().length > 0) {
      editor.chain().focus("end").insertContent(paragraphs("\n\n" + generatedResponse)).run();
      toast.success("Texte inséré à la suite du document.");
    } else {
      editor.commands.setContent(paragraphs(generatedResponse));
      toast.success("Texte inséré sur le papier.");
    }

    // Le bouton et la carte de résultat disparaissent immédiatement
    setShowResultCard(false);
    setGeneratedResponse("");
  };
   // Enregistrement au format choisi vers le dossier du téléphone
  const handleSaveDocument = async () => {
    if (!editor) return;
    const cleanName = (docFileName.trim() || "Document_BERSA").replace(/[^a-zA-Z0-9_\-]/g, "_");

    if (exportFormat === "docx") {
      const { buildDocx } = await import("@/lib/docx-export");
      const marginCm = settings.margin === "Étroites" ? 1.27 : settings.margin === "Larges" ? 3.5 : 2.5;
      const blob = await buildDocx(editor.getJSON() as any, {
        marginCm,
        lineSpacing: Number(settings.lineSpacing) || 1.6,
        landscape: settings.orientation === "Paysage",
        headerText: settings.headerText,
        footerText: settings.footerText,
        pageNumbers: true,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Document Word enregistré pour votre dossier (${targetFolder}).`);
      return;
    }

    if (exportFormat === "pdf") {
      window.print();
      toast.success("Impression / enregistrement PDF déclenché.");
      return;
    }

    // Format TXT
    const textBlob = new Blob([editor.getText({ blockSeparator: "\n\n" })], { type: "text/plain;charset=utf-8" });
    const textUrl = URL.createObjectURL(textBlob);
    const link = document.createElement("a");
    link.href = textUrl;
    link.download = `${cleanName}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(textUrl), 1000);
    toast.success(`Fichier texte enregistré pour votre dossier (${targetFolder}).`);
  };

  const copyGeneratedText = async () => {
    if (!generatedResponse) return;
    try {
      await navigator.clipboard.writeText(generatedResponse);
      setCopied(true);
      toast.success("Texte copié dans le presse-papier.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier.");
    }
  };

  async function run(chosen = action, isRegenerate = false) {
    if (!editor || busy) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    const rawText = isRegenerate
      ? lastPrompt
      : (promptInput.trim() || writingTarget(editor.getText(), { from, to, text: selected }).trim());
    const text = rawText.trim();
    if (!text) { toast.error("Écrivez votre consigne sur le papier ou dans le champ."); return; }
    if (files.some(file => file.type === "other")) { toast.info("Les pièces jointes non analysables ne sont pas transmises à l’Assistant."); }

    setBusy(true);
    setError("");
    setGeneratedResponse("");
    setShowResultCard(true);
    setLastPrompt(text);
    setPromptInput("");

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
        ...prev.slice(0, 9),
      ]);
      const response = await fetch("/api/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ action: chosen, text, attachments: files.filter(f => f.type !== "other") }),
      });
      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("Réponse vide.");

      let reply = "", failure = "";
      const parser = createParser({
        onEvent(event) {
          try {
            const item = JSON.parse(event.data);
            if (item.type === "quota") setQuota({ used: item.used, limit: item.limit });
            if (item.type === "delta") {
              reply += item.text;
              setGeneratedResponse(reply);
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
      if (failure) throw new Error(failure);
      if (!reply.trim()) throw new Error("L’Assistant n’a pas produit de texte.");
      toast.success("Texte généré ! Cliquez sur « Insérer dans le document ».");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Assistant indisponible.";
      setError(message);
      const match = message.match(/QUOTA_EXHAUSTED.*\((\d+)\/(\d+)\)/);
      if (match) setQuota({ used: Number(match[1]), limit: Number(match[2]) });
    } finally {
      setBusy(false);
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
    <Frame>
      <section aria-label="Assistant — éditeur Word" className={`home-editor mx-auto max-w-6xl sm:px-3 ${embedded ? "home-editor-embedded" : ""}`}>
               {/* Barre au-dessus du papier : Mise en forme, Améliorer & Enregistrer */}
        <div className="no-print mx-auto mb-1.5 flex w-full max-w-[794px] flex-col gap-1.5 px-1 sm:px-0 min-w-0">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/90 px-2.5 py-1.5 text-xs backdrop-blur-sm">
            
            {/* 1. Outils Word renommés « Mise en forme » avec flèche plus grande */}
            <button
              type="button"
              onClick={() => setRibbonOpen(!ribbonOpen)}
              className="flex items-center gap-1.5 font-bold text-primary hover:text-primary/80 transition-colors"
              title="Afficher ou masquer la mise en forme Word"
            >
              <PenTool className="h-4 w-4 text-primary" />
              <span>Mise en forme</span>
              {ribbonOpen ? (
                <ChevronUp className="h-5 w-5 text-primary stroke-[2.5]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-primary stroke-[2.5]" />
              )}
            </button>

            {/* Droite : Améliorer + Enregistrer */}
            <div className="flex items-center gap-1.5">
              {/* 2. Bouton « Améliorer » avec flèche plus grande */}
              <button
                type="button"
                onClick={() => setShowAssistantBar(!showAssistantBar)}
                className="flex items-center gap-1.5 font-bold text-primary hover:text-primary/80 text-xs bg-primary/10 rounded-full px-2.5 py-1 transition-colors"
                title="Fonctionnalités d'amélioration (Plan, développer, humaniser, résumer...)"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Améliorer</span>
                {showAssistantBar ? (
                  <ChevronUp className="h-4.5 w-4.5 text-primary stroke-[2.5]" />
                ) : (
                  <ChevronDown className="h-4.5 w-4.5 text-primary stroke-[2.5]" />
                )}
              </button>

              {/* 3. Bouton Enregistrer avec choix Word, PDF, dossier */}
              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1 font-semibold text-primary hover:text-primary/80 text-xs bg-muted hover:bg-muted/80 rounded-full px-2 py-1 transition-colors"
                title="Enregistrer le document (Word, PDF, Texte)"
              >
                <Save className="h-3.5 w-3.5 text-primary" />
                <span className="hidden xs:inline">Enregistrer</span>
              </button>
            </div>
          </div>

          {/* Fonctions sous Améliorer (défilement horizontal sans déborder l'écran) */}
          {showAssistantBar && (
            <div className="flex w-full items-center gap-1.5 overflow-x-auto rounded-lg border border-border/50 bg-card/95 p-1.5 text-xs scrollbar-none touch-pan-x min-w-0">
              {assistantActions.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  disabled={busy || transcribing || recording}
                  onClick={() => {
                    setAction(id);
                    void run(id);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                    id === "humanize"
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 font-bold"
                      : "bg-muted/70 text-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${id === "humanize" ? "bg-amber-500" : "bg-primary/70"}`} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Ruban complet : s'affiche uniquement quand vous cliquez sur Outils Word */}
        {ribbonOpen && (
          <div className="no-print mx-auto mb-2 max-w-[794px] overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all">
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
          </div>
        )}

        {/* Historique : s'affiche seulement si vous cliquez sur l'horloge dans la capsule */}
        {showHistory && history.length > 0 && (
          <div className="no-print mx-auto my-1.5 max-w-[794px] rounded-xl border border-border bg-card/95 p-2 text-xs shadow-md backdrop-blur-sm">
            <div className="mb-1.5 flex items-center justify-between border-b border-border/40 pb-1">
              <span className="font-semibold text-primary">
                Historique des demandes ({history.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded p-0.5 hover:bg-muted text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
              {history.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-2 rounded bg-muted/50 px-2 py-1 text-[11px]">
                  <span className="truncate text-foreground font-medium flex-1">
                    « {item.prompt} »
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
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
          <div className="no-print mx-auto mt-1 flex w-full max-w-[794px] items-center justify-between px-2 text-[11px] text-muted-foreground">
            <span>{settings.format} · Marges {settings.margin}</span>
            <span className="font-semibold text-primary">
              Page 1 sur {totalPages} ({totalPages === 1 ? "1 feuille A4" : `${totalPages} feuilles A4`})
            </span>
          </div>
        </div>

          {/* Boutons flottants persistants (mobile et ordinateur) style capsule, restant au-dessus du clavier */}
                  {/* Espace de commande & Résultats ChatGPT / WPS Word */}
        <div
          className={`no-print home-editor-commands border border-border/80 bg-card/98 p-2.5 shadow-xl backdrop-blur-md transition-all duration-150 ease-out ${
            embedded
              ? "mx-auto w-full max-w-[794px] rounded-2xl mb-2"
              : "fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[580px] z-50 rounded-2xl"
          }`}
          style={{
            bottom: embedded ? undefined : keyboardOffset > 0 ? `${keyboardOffset + 14}px` : "1.25rem",
            transform: "translateZ(0)",
          }}
        >
          {/* FENÊTRE DE RÉSULTAT STYLE CHATGPT / WPS WORD AI */}
          {showResultCard && (generatedResponse || busy) && (
            <div className="mb-2 rounded-xl border border-primary/25 bg-background/95 p-3 shadow-lg">
              {/* En-tête du résultat */}
              <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {busy ? "Génération en cours…" : "Texte généré par l'Assistant"}
                </span>
                <div className="flex items-center gap-1.5">
                  {generatedResponse && (
                    <button
                      type="button"
                      onClick={() => void copyGeneratedText()}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Copier le texte"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copié" : "Copier"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowResultCard(false)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Fermer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Contenu du texte généré avec défilement pour grands textes */}
              <div className="max-h-64 overflow-y-auto pr-1 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed select-text scrollbar-thin">
                {generatedResponse || <span className="text-muted-foreground italic flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rédaction de votre demande…</span>}
              </div>
              {/* BOUTON INSÉRER : apparaît d'un coût puis disparaît dès que le texte est inséré */}
              {generatedResponse && !busy && (
                <div className="mt-2.5 flex items-center gap-2 border-t border-border/40 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => insertIntoPaper("auto")}
                    className="flex-1 h-8 rounded-lg bg-[#0a192f] text-white hover:bg-[#1e3a8a] text-xs font-bold gap-1.5 shadow"
                  >
                    <FileDown className="h-4 w-4 text-amber-400" />
                    <span>Insérer</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void run(action, true)}
                    className="h-8 rounded-lg text-xs gap-1 border-border/70"
                    title="Régénérer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Régénérer</span>
                  </Button>
                </div>
              )}
               </div>
                )}
          {/* Zone de saisie supérieure auto-agrandissante */}
          <textarea
            value={promptInput}
            onChange={(e) => {
              setPromptInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !busy) {
                e.preventDefault();
                void run();
              }
            }}
            placeholder="Écrivez votre consigne ou texte à rédiger..."
            rows={1}
            className="w-full resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[38px] max-h-28"
          />

          {/* Rangée inférieure : Trombone à gauche, Commandes & Quota à droite */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* COIN GAUCHE */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border/70 hover:bg-muted text-primary shrink-0 shadow-sm"
                title="Ajouter un document (Word, PDF, texte, image)"
                aria-label="Ajouter un document"
                onClick={() => fileInput.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              {history.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted shrink-0"
                  onClick={() => setShowHistory(!showHistory)}
                  title={`Historique (${history.length})`}
                >
                  <History className="h-4 w-4" />
                </Button>
              )}

              {files.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {files.length} doc{files.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* COIN DROIT */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted shrink-0"
                title="Consigne audio"
                onClick={() => void toggleRecord()}
                disabled={transcribing || busy}
              >
                {recording ? <Square className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4 text-primary" />}
              </Button>

              {lastPrompt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 shrink-0"
                  onClick={() => void run(action, true)}
                  disabled={busy}
                  title="Régénérer"
                >
                  <RotateCcw className={`h-4 w-4 ${busy ? "animate-spin text-primary" : ""}`} />
                </Button>
              )}

              <Button
                size="sm"
                className="h-8 rounded-full px-3 text-xs font-medium shadow-md gap-1.5 bg-[#0a192f] text-white hover:bg-[#1e3a8a] shrink-0"
                onClick={() => void run()}
                disabled={busy || recording || transcribing}
                aria-label="Envoyer"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{busy ? "Rédaction…" : "Envoyer"}</span>
              </Button>

              <div className="h-5 w-[1px] bg-border/60 mx-0.5" />

              <Link
                to="/abonnements"
                className="flex h-8 items-center gap-1 rounded-full px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors shrink-0"
                title={quota ? `${remaining} conversations restantes sur ${quota.limit}` : "Formules d'abonnement"}
              >
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold">
                  {remaining !== null ? `${remaining}` : "0"}
                </span>
              </Link>
            </div>
          </div>
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
       {/* Modale d'enregistrement avec proposition du dossier sur le téléphone */}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between border-b pb-2">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-primary">
                  <Save className="h-4 w-4 text-amber-500" />
                  Enregistrer le document
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-semibold text-foreground">Nom du document :</label>
                  <input
                    type="text"
                    value={docFileName}
                    onChange={(e) => setDocFileName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                    placeholder="Mon_Document_BERSA"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">Format d'export :</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "docx", label: "Word (.docx)" },
                      { id: "pdf", label: "PDF (.pdf)" },
                      { id: "txt", label: "Texte (.txt)" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setExportFormat(f.id as any)}
                        className={`rounded-lg border px-2 py-1.5 text-center font-medium transition-colors ${
                          exportFormat === f.id
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">Dossier sur votre téléphone :</label>
                  <select
                    value={targetFolder}
                    onChange={(e) => setTargetFolder(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                  >
                    <option value="Téléchargements (Downloads)">📁 Téléchargements (Downloads)</option>
                    <option value="Documents">📁 Documents</option>
                    <option value="Dossier BERSA">📁 Dossier BERSA</option>
                    <option value="Mémoire interne">📁 Stockage interne</option>
                  </select>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Le fichier sera téléchargé directement pour être stocké dans ce dossier.
                  </p>
                </div>

                <div className="mt-4 flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 h-8 rounded-lg text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      await handleSaveDocument();
                      setShowSaveModal(false);
                    }}
                    className="flex-1 h-8 rounded-lg bg-[#0a192f] text-white hover:bg-[#1e3a8a] text-xs font-semibold gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}  
      </section>
    </Frame>
  );
}
