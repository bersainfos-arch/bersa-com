import { KeepBlockStyle } from "@/lib/keep-block-style";
import { CommentMark, InsertionMark, TrackChanges } from "@/lib/review-marks";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { DocumentMenuActions } from "@/components/AppShell";
import { useEditor, EditorContent } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { ParagraphIndent } from "@/lib/writer-commands";
import { toast } from "sonner";
import { ArrowUp, Share2,
  Send,
  Loader2,
  Mic,
  Square,
  Trash2,
  X,
  FileAudio,
  Paperclip,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  History,
  PenTool,
  Copy,
  Check,
  FileDown,
  Plus,
  Save,
  Download,
  Folder,
  FileText,
  Undo2,
  Redo2,
} from "lucide-react";
import { importDocumentFile, takeDocumentFile, sanitizeDocumentHtml } from "@/lib/document-import";
import { AutoPages } from "@/lib/editor-pagination";
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
  const openFileInput = useRef<HTMLInputElement>(null);
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
    const [ribbonOpen, setRibbonOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
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
  const [cloudId, setCloudId] = useState<string | null>(null);
  const [cloudState, setCloudState] = useState("");
  const [versions, setVersions] = useState<Array<{ id: string; title: string; created_at: string }> | null>(null);
    const Frame = (embedded ? (({ children }: any) => <>{children}</>) : AppShell) as React.ComponentType<{
    children: ReactNode;
    minimal?: boolean;
    title?: string;
    onTitleChange?: (val: string) => void;
    documentActions?: DocumentMenuActions;
  }>;
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
    extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ["heading", "paragraph"] }), Image.configure({ allowBase64: true }), Table.configure({ resizable: true }), TableRow, TableCell, TableHeader, Highlight.configure({ multicolor: true }), PageBreak, Footnote, AutoPages, KeepBlockStyle, Subscript, Superscript, ParagraphIndent, CommentMark, InsertionMark, TrackChanges],
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
    let cancelled = false;
    const id = sessionStorage.getItem("bersa-document-id");
    const html = sessionStorage.getItem("bersa-document-html");
    const file = takeDocumentFile();
    const title = sessionStorage.getItem("bersa-document-title");
    if (title) setDocFileName(title);
    for (const key of ["bersa-document-id", "bersa-document-html", "bersa-document-title"]) sessionStorage.removeItem(key);
    const open = async () => {
      try {
        if (file) {
          const result = await importDocumentFile(file);
          if (cancelled) return;
          editor.commands.setContent(result.html);
          setDocFileName(file.name.replace(/\.[^.]+$/, ""));
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            const { error } = await supabase.from("user_docs").insert({title: file.name, content: result.html, category: "general", user_id: data.user.id});
            if (error) toast.error("Fichier ouvert, mais non enregistré en ligne.");
          }
        } else if (id) {
          const { data, error } = await supabase.from("user_docs").select("content,title").eq("id", id).single();
          if (error || !data) throw new Error("Document indisponible.");
          if (!cancelled) { editor.commands.setContent(sanitizeDocumentHtml(data.content)); setDocFileName(data.title); setCloudId(id); }
        } else if (html) editor.commands.setContent(sanitizeDocumentHtml(html));
      } catch (error) { toast.error(error instanceof Error ? error.message : "Ouverture impossible."); }
    };
    void open();
    return () => { cancelled = true; };
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
        const json = JSON.stringify(editor.getJSON());
        if (json !== localStorage.getItem("bersa_current_draft")) {
          setSaveState("saving");
          localStorage.setItem("bersa_current_draft", json);
          setSaveState("saved");
        }
      }
    }, 2000);
    const onUpdate = () => setSaveState("idle");
    editor.on("update", onUpdate);
    return () => { clearInterval(saveTimer); editor.off("update", onUpdate); };
  }, [editor]);
  // Enregistrement automatique en ligne (compte connecté), toutes les 20 secondes si le texte a changé
  const lastCloud = useRef("");
  useEffect(() => {
    if (!editor) return;
    const t = setInterval(async () => {
      const html = editor.getHTML();
      if (!editor.getText().trim() || html === lastCloud.current) return;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setCloudState("Hors ligne : non connecté"); return; }
      setCloudState("Enregistrement en ligne…");
      const row = { title: (docFileName || "Document BERSA").slice(0, 200), content: html, category: "general", word_count: editor.getText().trim().split(/\s+/).length };
      const res = cloudId
        ? await supabase.from("user_docs").update(row).eq("id", cloudId).select("id").single()
        : await supabase.from("user_docs").insert({ ...row, user_id: u.user.id }).select("id").single();
      if (res.error || !res.data) { setCloudState("Échec de l'enregistrement en ligne"); return; }
      lastCloud.current = html; setCloudId(res.data.id);
      setCloudState(`Enregistré en ligne à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
    }, 20000);
    return () => clearInterval(t);
  }, [editor, cloudId, docFileName]);

  const saveVersion = async () => {
    if (!editor) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { toast.error("Connectez-vous pour garder des versions."); return; }
    const stamp = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const { error: e } = await supabase.from("user_docs").insert({ user_id: u.user.id, title: `${docFileName || "Document"} — version ${stamp}`.slice(0, 200), content: editor.getHTML(), category: "version", word_count: editor.getText().trim().split(/\s+/).length });
    if (e) toast.error("Version non enregistrée."); else toast.success("Version enregistrée");
  };
  const openVersions = async () => {
    const { data, error: e } = await supabase.from("user_docs").select("id,title,created_at").eq("category", "version").order("created_at", { ascending: false }).limit(30);
    if (e) { toast.error("Historique indisponible."); return; }
    setVersions(data ?? []);
  };
  const restoreVersion = async (id: string) => {
    if (!editor || !window.confirm("Remplacer le texte actuel par cette version ?")) return;
    const { data } = await supabase.from("user_docs").select("content").eq("id", id).single();
    if (data) { editor.commands.setContent(sanitizeDocumentHtml(data.content)); toast.success("Version restaurée"); setVersions(null); }
  };
  const exportPdf = async () => {
    if (!editor) return;
    try {
      toast.info("Création du PDF…");
      const { buildPdf } = await import("@/lib/pdf-export");
      const blob = await buildPdf(editor.getHTML(), { marginPx: settings.margin === "Étroites" ? 48 : settings.margin === "Larges" ? 132 : 94, lineSpacing: Number(settings.lineSpacing) || 1.6, headerText: settings.headerText, footerText: settings.footerText, columns: settings.columns, landscape: settings.orientation === "Paysage" });
      const name = `${(docFileName.trim() || "Document_BERSA").replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`;
      if (await pickAndWrite(blob, name, "Document PDF", { "application/pdf": [".pdf"] })) { toast.success("PDF enregistré."); return; }
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("PDF téléchargé.");
    } catch { toast.error("Création du PDF impossible."); }
  };

  const handleOpenLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const result = await importDocumentFile(file);
      editor.commands.setContent(result.html);
      const cleanTitle = file.name.replace(/\.[^.]+$/, "");
      setDocFileName(cleanTitle);
      toast.success(`« ${file.name} » ouvert dans l'atelier pour retouche.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'ouvrir ce document.");
    } finally {
      e.target.value = "";
    }
  };

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
    const firstLine = generatedResponse.trim().split("\n")[0]!.replace(/^[#*\s]+|[*:]+$/g, "").trim();
    if (firstLine && firstLine.length <= 110 && firstLine.split(/\s+/).length <= 16) setDocFileName(firstLine);
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
  // Choix du dossier (ordinateur / Android Chrome) ; repli sur téléchargement direct
  const pickAndWrite = async (blob: Blob, name: string, description: string, accept: Record<string, string[]>) => {
    const picker = (window as any).showSaveFilePicker;
    if (!picker) return false;
    try {
      const handle = await picker({ suggestedName: name, types: [{ description, accept }] });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return true;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return true;
      return false;
    }
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
      if (await pickAndWrite(blob, `${cleanName}.docx`, "Document Word", { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] })) { toast.success("Document Word enregistré."); return; }
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

    if (exportFormat === "pdf") { await exportPdf(); return; }

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

  const shareGeneratedText = async () => {
    if (!generatedResponse) return;
    try {
      if (navigator.share) await navigator.share({ title: docFileName, text: generatedResponse });
      else { await navigator.clipboard.writeText(generatedResponse); toast.success("Texte copié pour le partage."); }
    } catch {}
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
        // Génération automatique du titre à partir de la consigne posée
    if (text) {
      const topic = text.split(/[\n.?!]/)[0]!
        .replace(/^(s'il te pla[iî]t|stp)[,\s]*/i, "")
        .replace(/^(peux-tu|pourrais-tu|merci de|je veux|je voudrais)\s+/i, "")
        .replace(/^(r[ée]dige[rz]?(-moi)?|[ée]cri[st](-moi)?|fai[st](-moi)?|g[ée]n[èe]re[rz]?|donne(-moi)?|pr[ée]pare[rz]?|cr[ée]e[rz]?|produi[st])\s+/i, "")
        .replace(/^(un|une|le|la|les|des|l')\s*/i, "")
        .replace(/[«»"']/g, "").trim();
      const words = topic.split(/\s+/).slice(0, 8).join(" ");
      const generatedTitle = words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
      if (generatedTitle && (docFileName === "Mon_Document_BERSA" || !docFileName.trim())) {
        setDocFileName(generatedTitle);
      }
    }
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
      if (isRegenerate) {
        const t = reply.trim().split("\n")[0]!.replace(/^[#*\s]+/, "").slice(0, 90) || "Texte régénéré";
        void supabase.from("user_docs").insert({ title: `${t} (version régénérée)`, category: "general", content: paragraphs(reply).map((n: any) => `<p>${String(n.content?.[0]?.text ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")}</p>`).join(""), word_count: reply.split(/\s+/).filter(Boolean).length });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Assistant indisponible.";
      setError(message);
      const match = message.match(/QUOTA_EXHAUSTED.*\((\d+)\/(\d+)\)/);
      if (match) setQuota({ used: Number(match[1]), limit: Number(match[2]) });
    } finally {
      setBusy(false);
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

      const documentMenuActions = {
    onSave: () => void handleSaveDocument(),
    onSaveAs: () => setShowSaveModal(true),
    onSaveAsWord: () => void (async () => {
      if (!editor) return;
      const html = `<html><head><meta charset="utf-8"><title>${docFileName}</title></head><body style="font-family:'Times New Roman';font-size:13pt;line-height:1.6">${editor.getHTML()}</body></html>`;
      const blob = new Blob([html], { type: "application/msword" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${docFileName || "Document_BERSA"}.doc`;
      a.click();
      toast.success("Document Word téléchargé.");
    })(),
    onSaveAsPdf: () => void (async () => {
      if (!editor) return;
      const w = window.open("", "_blank");
      if (!w) { toast.error("Autorisez les fenêtres pour exporter en PDF."); return; }
      w.document.write(`<html><head><meta charset="utf-8"><title>${docFileName}</title><style>@page{size:A4;margin:2cm}body{font-family:'Times New Roman';font-size:13pt;line-height:1.6}</style></head><body>${editor.getHTML()}</body></html>`);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 300);
    })(),
    onSaveAsTxt: () => void (async () => {
      if (!editor) return;
      const blob = new Blob([editor.getText()], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${docFileName || "Document_BERSA"}.txt`;
      a.click();
      toast.success("Fichier texte téléchargé.");
    })(),
    onSaveAsHtml: () => void (async () => {
      if (!editor) return;
      const blob = new Blob([editor.getHTML()], { type: "text/html" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${docFileName || "Document_BERSA"}.html`;
      a.click();
      toast.success("Page web HTML téléchargée.");
    })(),
    onNewDoc: () => {
      if (!editor) return;
      if (confirm("Créer un nouveau document vierge ? Les modifications non enregistrées seront effacées.")) {
        editor.commands.setContent("<p></p>");
        setDocFileName("Mon_Document_BERSA");
        toast.success("Feuille blanche A4 prête.");
      }
    },
    onOpenFile: () => openFileInput.current?.click(),
    onRename: () => {
      const next = prompt("Nouveau nom du document :", docFileName)?.trim();
      if (next) { setDocFileName(next); toast.success("Document renommé."); }
    },
    onShare: async () => {
      if (!editor) return;
      const clean = (docFileName.trim() || "Document_BERSA").replace(/[^\p{L}\p{N}_\- ]/gu, "_");
      try {
        const { buildDocx } = await import("@/lib/docx-export");
        const blob = await buildDocx(editor.getJSON() as any, { pageNumbers: true });
        const file = new File([blob], `${clean}.docx`, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: docFileName, files: [file] });
          return;
        }
        if (navigator.share) { await navigator.share({ title: docFileName, text: editor.getText().slice(0, 4000) }); return; }
        await navigator.clipboard.writeText(editor.getText());
        toast.info("Texte copié : collez-le dans l'application de votre choix.");
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") toast.error("Partage impossible sur cet appareil.");
      }
    },
    onDuplicate: async () => {
      if (!editor) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("user_docs").insert({
        user_id: data.user.id,
        title: `${docFileName} (Copie)`,
        content: editor.getHTML(),
        word_count: editor.getText().split(/\s+/).filter(Boolean).length,
        category: "general"
      });
      toast.success("Copie enregistrée dans vos documents.");
    },
    onDelete: () => {
      if (!editor) return;
      if (confirm("Supprimer ce document de la feuille ? Cette action est définitive.")) {
        editor.commands.setContent("<p></p>");
        setDocFileName("Mon_Document_BERSA");
        try { localStorage.removeItem("bersa-home-draft"); } catch {}
        toast.success("Document supprimé.");
      }
    },
  };

    return (
    <Frame minimal title={docFileName} onTitleChange={setDocFileName} documentActions={documentMenuActions}>
      <section aria-label="Assistant — éditeur Word" className={`home-editor mx-auto max-w-6xl sm:px-3 ${embedded ? "home-editor-embedded" : ""}`}>
       {/* Barre au-dessus du papier : Mise en forme, Améliorer & Enregistrer */}
        <div className="no-print mx-auto mb-1.5 flex w-full max-w-[794px] flex-col gap-1.5 px-1 sm:px-0 min-w-0">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/90 px-2.5 py-1.5 text-xs backdrop-blur-sm">
            
            {/* 1. Outils Word « Mise en forme » avec boutons Annuler et Rétablir */}
            <div className="flex items-center gap-1">
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

                <div className="flex items-center gap-1 border-l border-border/60 pl-2 ml-1.5">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().undo().run()}
                  disabled={!editor?.can().undo()}
                  className="p-1.5 rounded-md hover:bg-muted text-foreground hover:text-primary disabled:opacity-30 transition"
                  title="Annuler (Ctrl+Z)"
                  aria-label="Annuler"
                >
                  <Undo2 className="h-5 w-5 stroke-[2.2]" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().redo().run()}
                  disabled={!editor?.can().redo()}
                  className="p-1.5 rounded-md hover:bg-muted text-foreground hover:text-primary disabled:opacity-30 transition"
                  title="Rétablir (Ctrl+Y)"
                  aria-label="Rétablir"
                >
                  <Redo2 className="h-5 w-5 stroke-[2.2]" />
                </button>
              </div>
            </div> 

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
              exportPdf={() => void exportPdf()}
              saveVersion={() => void saveVersion()}
              openVersions={() => void openVersions()}
              cloudState={cloudState}
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
        <input
  ref={openFileInput}
  type="file"
  accept=".docx,.doc,.pdf,.txt,.md,.csv,.html,.htm"
  className="hidden"
  onChange={handleOpenLocalFile}
/>

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
          style={{ ["--writer-line" as string]: settings.lineSpacing || "1.6", ["--writer-margin-scale" as string]: settings.margin === "Étroites" ? "0.5" : settings.margin === "Larges" ? "1.3" : "1", ["--writer-page-color" as string]: settings.pageColor || "#ffffff" } as React.CSSProperties}
          className={`bersa-writer-workspace home-paper-desk a4-desk margin-${settings.margin} orientation-${settings.orientation} format-${settings.format} zoom-${settings.zoom.replace("%", "")} cols-${settings.columns || 1}${settings.pageBorder ? " page-border" : ""}`}
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
          {/* Règle graduée A4 utile (0 à 16 cm de largeur d'écriture) */}
          {settings.ruler && (
            <div className="bersa-writer-ruler no-print mx-auto mb-2" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="bersa-writer-ruler-tick">
                  <span>{i + 1}</span>
                </div>
              ))}
            </div>
          )}

          {settings.headerText && <div className="bersa-page-header mx-auto max-w-[794px]">{settings.headerText}</div>}
          <EditorContent editor={editor} className="home-paper-content" />
          {settings.footerText && <div className="bersa-page-footer mx-auto max-w-[794px]">{settings.footerText}</div>}
          {versions && (
            <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center" onClick={() => setVersions(null)}>
              <div className="w-full max-w-md rounded-xl bg-card p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Historique des versions</h3><Button size="sm" variant="ghost" onClick={() => setVersions(null)}>Fermer</Button></div>
                {versions.length === 0 ? <p className="text-sm text-muted-foreground">Aucune version enregistrée.</p> : (
                  <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
                    {versions.map(v => <li key={v.id}><button type="button" className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => void restoreVersion(v.id)}>{v.title}</button></li>)}
                  </ul>
                )}
              </div>
            </div>
          )}
        
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
            <span>{settings.format} · Marges {settings.margin} · <span aria-live="polite">{saveState === "saved" ? (cloudState.startsWith("Enregistré en ligne") ? cloudState : "Enregistré sur l'appareil") : saveState === "saving" ? "Enregistrement…" : "Modifications en cours"}</span></span>
            <span className="font-semibold text-primary">
              Page 1 sur {totalPages} ({totalPages === 1 ? "1 feuille A4" : `${totalPages} feuilles A4`})
            </span>
          </div>
        </div>

          {!embedded && !assistantOpen && (
            <button type="button" onClick={() => setAssistantOpen(true)} className="no-print fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl" style={{ bottom: keyboardOffset > 0 ? `${keyboardOffset + 14}px` : "1.25rem" }} aria-label="Ouvrir l'assistant BERSA" title="Assistant BERSA"><Sparkles className="h-5 w-5" /></button>
          )}
          {/* Boutons flottants persistants (mobile et ordinateur) style capsule, restant au-dessus du clavier */}
                  {/* Espace de commande & Résultats ChatGPT / WPS Word */}
        <div
          hidden={!embedded && !assistantOpen}
          className={`no-print home-editor-commands border border-border/80 bg-card/98 p-1.5 shadow-xl backdrop-blur-md transition-all duration-150 ease-out ${
            embedded
              ? "mx-auto w-full max-w-[794px] rounded-2xl mb-2"
              : "fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[500px] z-50 rounded-2xl"
          }`}
          style={{
            bottom: embedded ? undefined : keyboardOffset > 0 ? `${keyboardOffset + 14}px` : "1.25rem",
            transform: "translateZ(0)",
          }}
        >
          <button type="button" onClick={() => setAssistantOpen(false)} className="absolute -top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow hover:text-primary" aria-label="Réduire l'assistant" title="Réduire l'assistant"><ChevronDown className="h-4 w-4" /></button>
          {/* FENÊTRE DE RÉSULTAT STYLE CHATGPT / WPS WORD AI */}
          {showResultCard && (generatedResponse || busy) && (
            <div className="mb-2 rounded-xl border border-border bg-muted p-2.5 shadow-md">
              {/* En-tête du résultat */}
              <div className="mb-2 flex items-center justify-between border-b border-border/40 pb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {busy ? "Génération en cours…" : "Texte généré par l'Assistant"}
                </span>
                <div className="flex items-center gap-1.5">
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
                <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-border/40 pt-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void shareGeneratedText()} className="h-8 rounded-lg text-xs gap-1 px-2.5" title="Partager">
                    <Share2 className="h-3.5 w-3.5" /><span>Partager</span>
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void copyGeneratedText()} className="h-8 rounded-lg text-xs gap-1 px-2.5" title="Copier">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}<span>{copied ? "Copié" : "Copier"}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => insertIntoPaper("auto")}
                    className="h-8 px-3 rounded-lg bg-[#0a192f] text-white hover:bg-[#1e3a8a] text-xs font-bold gap-1.5 shadow"
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
          {/* Badge du document joint visible dans l'item de demande façon ChatGPT */}
          {files.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto px-1 pb-1.5 pt-1">
              {files.map((f, idx) => (
                <span
                  key={idx}
                  className="relative flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/70 py-1.5 pl-1.5 pr-5 text-[11px]"
                >
                  {f.type === "image" ? <img src={`data:${(f as any).mediaType};base64,${f.content}`} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><FileText className="h-4 w-4" /></span>}
                  <span className="flex flex-col leading-tight"><span className="max-w-[120px] truncate font-semibold text-foreground">{f.name}</span><span className="text-[10px] uppercase text-muted-foreground">{f.name.split(".").pop()}</span></span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute right-1 top-0.5 text-muted-foreground hover:text-destructive font-bold text-xs"
                    title="Retirer ce document"
                  >
                    ×
                  </button>
                </span>
              ))}
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
            className="w-full resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[32px] max-h-28"
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
                className="h-8 w-8 p-0 rounded-full bg-foreground text-background hover:bg-foreground/85 shrink-0"
                onClick={() => void run()}
                disabled={busy || recording || transcribing}
                aria-label="Envoyer"
              >
                {busy ? <Square className="h-3 w-3 fill-current" /> : <ArrowUp className="h-4 w-4 stroke-[2.5]" />}
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
                {/* ========================================================= */}
        {/* Barre d'état inférieure permanente BERSA WRITER (Word/WPS) */}
        {/* ========================================================= */}
        <div className="bersa-writer-statusbar no-print">
          {/* À gauche : Page, Mots, Caractères */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            <span className="font-semibold text-primary">
              Page 1 sur {totalPages}
            </span>
            <span className="text-muted-foreground">•</span>
            <span>
              {editor?.getText().trim() ? editor.getText().trim().split(/\s+/).filter(Boolean).length : 0} mots
            </span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="hidden sm:inline">
              {editor?.getText().length || 0} caractères
            </span>
          </div>

          {/* À droite : Langue & Zoom interactif */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            <span className="font-medium text-muted-foreground hidden xs:inline">Français</span>
            <span className="hidden xs:inline text-muted-foreground">•</span>
            <div className="flex items-center gap-1 bg-muted/60 rounded px-1 py-0.5 border border-border/50">
              <button
                type="button"
                className="px-1.5 py-0.5 font-bold hover:bg-background rounded transition"
                onClick={() => {
                  const current = parseInt(settings.zoom) || 100;
                  const next = Math.max(50, current - 10);
                  setSettings(s => ({ ...s, zoom: `${next}%` }));
                }}
                title="Réduire le zoom (-10%)"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-foreground">
                {settings.zoom || "100%"}
              </span>
              <button
                type="button"
                className="px-1.5 py-0.5 font-bold hover:bg-background rounded transition"
                onClick={() => {
                  const current = parseInt(settings.zoom) || 100;
                  const next = Math.min(200, current + 10);
                  setSettings(s => ({ ...s, zoom: `${next}%` }));
                }}
                title="Agrandir le zoom (+10%)"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>
    </Frame>
  );
}
