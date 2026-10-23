import React, { useMemo, useRef, useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { buildDocx } from "@/lib/docx-export";
import { askAssistant } from "@/lib/assistant.functions";
import mammoth from "mammoth";
import {
  ArrowLeft, Cloud, MoreVertical, Undo2, Redo2, Bold, Italic,
  Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, FileText, Keyboard, Mic,
  Sparkles, RefreshCw, Minus, Plus, Download, Printer, Save,
  FileUp, Search, X, Check, Copy, Share2
} from "lucide-react";
import "./BersaWordA4.css";

export type BersaWordA4Props = {
  initialTitle?: string;
  initialContent?: string;
  onBack?: () => void;
};

const FONTS = ["Times New Roman", "Arial", "Calibri", "Georgia", "Verdana"];
const SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 36, 48];

export function BersaWordA4({
  initialTitle = "Mon atelier de rédaction",
  initialContent = "<h2>Titre du document</h2><p>Commencez à rédiger votre document académique ou professionnel ici…</p>",
  onBack,
}: BersaWordA4Props) {
  const [title, setTitle] = useState(initialTitle);
  const [tab, setTab] = useState<"Accueil" | "Insertion" | "Mise en page" | "Révision" | "Affichage">("Accueil");
  const [saveState, setSaveState] = useState<"Enregistré" | "Enregistrement…" | "Erreur">("Enregistré");
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [font, setFont] = useState("Times New Roman");
  const [size, setSize] = useState("13");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margins, setMargins] = useState("2.5cm");
  const [notice, setNotice] = useState("");

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<"assistant" | "regenerate">("regenerate");
  const [aiInstruction, setAiInstruction] = useState("Reformuler");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "bw-editor-content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: ed }) => {
      setSaveState("Enregistrement…");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            "bersa-word-draft",
            JSON.stringify({
              title,
              html: ed.getHTML(),
              text: ed.getText(),
              updatedAt: new Date().toISOString(),
            })
          );
          setSaveState("Enregistré");
        } catch {
          setSaveState("Erreur");
        }
      }, 800);
    },
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bersa-word-draft");
      if (saved && editor) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.html && !initialContent.includes("Titre du document")) {
          editor.commands.setContent(parsed.html);
        }
      }
    } catch {}
  }, [editor]);

  const wordCount = useMemo(() => {
    const t = editor?.getText().trim() || "";
    return t ? t.split(/\s+/).length : 0;
  }, [editor?.state.doc.content.size, editor]);

  const charCount = editor?.getText().length || 0;
  const pageCount = Math.max(1, Math.ceil(charCount / (orientation === "portrait" ? 1800 : 2400)));

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const safeFilename = (name: string) =>
    name.replace(/[^\p{L}\p{N}_-]+/gu, "-").toLowerCase() || "document-bersa";

  const exportDocxReal = async () => {
    if (!editor) return;
    try {
      setNotice("Génération du document Word (.docx) réel…");
      const json = editor.getJSON();
      const blob = await buildDocx(json, {
        title,
        marginCm: margins === "1.27cm" ? 1.27 : margins === "3.8cm" ? 3.8 : 2.5,
        landscape: orientation === "landscape",
        pageNumbers: true,
      });
      downloadBlob(blob, `${safeFilename(title)}.docx`);
      setNotice("Document Word (.docx) téléchargé avec succès.");
    } catch (e: any) {
      setNotice("Erreur lors de l'export Word : " + (e?.message || "Inconnue"));
    }
  };

  const exportTxt = () => {
    if (!editor) return;
    const blob = new Blob([editor.getText()], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, `${safeFilename(title)}.txt`);
  };

  const exportHtml = () => {
    if (!editor) return;
    const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:A4 ${orientation};margin:${margins};}body{font-family:'${font}',Times,serif;font-size:${size}pt;line-height:1.6;max-width:794px;margin:auto;padding:2cm;}</style></head><body>${editor.getHTML()}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `${safeFilename(title)}.html`);
  };

  const handleImportFile = async (file: File) => {
    if (!editor) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (ext === "docx") {
        setNotice("Conversion du document Word…");
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.convertToHtml({ arrayBuffer });
        editor.commands.setContent(res.value || "<p></p>");
        setTitle(file.name.replace(/\.docx$/i, ""));
        setNotice("Document Word importé avec succès.");
      } else if (ext === "html" || ext === "htm") {
        const text = await file.text();
        editor.commands.setContent(text);
        setTitle(file.name.replace(/\.html?$/i, ""));
        setNotice("Fichier HTML importé.");
      } else {
        const text = await file.text();
        const formatted = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");
        editor.commands.setContent(`<p>${formatted}</p>`);
        setTitle(file.name.replace(/\.txt$/i, ""));
        setNotice("Fichier texte importé.");
      }
    } catch (e: any) {
      setNotice("Échec de l'importation : " + (e?.message || "fichier non supporté"));
    }
  };

  const startDictation = () => {
    const win = window as any;
    const Speech = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Speech) {
      setNotice("Dictée vocale non supportée. Utilisez le micro de votre clavier Android.");
      return;
    }
    try {
      const recognition = new Speech();
      recognition.lang = "fr-FR";
      recognition.interimResults = false;
      recognition.onstart = () => setNotice("🎤 Écoute en cours… Parlez distinctement.");
      recognition.onresult = (e: any) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript && editor) {
          editor.chain().focus().insertContent(" " + transcript).run();
        }
      };
      recognition.onerror = (e: any) => setNotice("Microphone : " + (e?.error || "accès refusé"));
      recognition.onend = () => setNotice("Dictée terminée.");
      recognition.start();
    } catch {
      setNotice("Impossible de démarrer la reconnaissance vocale.");
    }
  };
