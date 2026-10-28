import React, { useMemo, useRef, useState, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
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
    immediatelyRender: false,
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
  const handleOpenAi = (mode: "assistant" | "regenerate") => {
    setAiMode(mode);
    setAiResult("");
    if (!editor) return;
    const { from, to } = editor.state.selection;
    let selected = "";
    if (from !== to) {
      selected = editor.state.doc.textBetween(from, to, "\n");
    } else {
      selected = editor.state.doc.textBetween(Math.max(0, from - 300), Math.min(editor.state.doc.content.size, from + 300), "\n");
    }
    setAiPrompt(selected.trim());
    setShowAiModal(true);
  };

  const executeAi = async () => {
    if (!aiPrompt.trim()) {
      setNotice("Sélectionnez ou saisissez d'abord un passage.");
      return;
    }
    setAiBusy(true);
    try {
      const promptText = aiMode === "regenerate"
        ? `Consigne : ${aiInstruction} le texte suivant dans un style rigoureux et académique. Ne renvoie que le texte amélioré sans bavardage.\n\nTexte :\n${aiPrompt}`
        : `Tu es l'assistant de rédaction BERSA. Agis selon cette demande : ${aiInstruction}.\n\nTexte ou sujet :\n${aiPrompt}`;

      const res = await askAssistant({
        data: { messages: [{ role: "user", content: promptText }] },
      });
      setAiResult(res?.reply || "Aucune réponse générée.");
    } catch (e: any) {
      setAiResult("Assistant indisponible : " + (e?.message || "Vérifiez votre connexion."));
    } finally {
      setAiBusy(false);
    }
  };

  const applyAiResult = (mode: "replace" | "insertAfter") => {
    if (!editor || !aiResult) return;
    const { from, to } = editor.state.selection;
    if (mode === "replace" && from !== to) {
      editor.chain().focus().insertContentAt({ from, to }, aiResult).run();
    } else {
      editor.chain().focus().insertContentAt(to, "\n\n" + aiResult).run();
    }
    setShowAiModal(false);
    setAiResult("");
  };

  const handleReplaceAll = () => {
    if (!editor || !searchTerm) return;
    const currentHtml = editor.getHTML();
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (currentHtml.match(regex) || []).length;
    editor.commands.setContent(currentHtml.replace(regex, replaceTerm));
    setNotice(`${count} occurrence(s) remplacée(s).`);
  };

  return (
    <div className="bersa-word-app">
      {/* 1. BANDEAU BLEU ROI */}
      <header className="bw-top-header">
        <button type="button" className="bw-btn-icon" onClick={onBack || (() => window.history.back())}>
          <ArrowLeft size={18} />
        </button>
        <div className="bw-brand-block">
          <span className="bw-brand-badge">B</span>
          <div className="bw-brand-text">
            <strong>BERSA</strong>
            <small>Atelier Word A4</small>
          </div>
        </div>
        <div className="bw-doc-title-box">
          <input
            className="bw-doc-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du document…"
          />
          <div className="bw-save-indicator">
            <Cloud size={11} />
            <span>{saveState}</span>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button type="button" className="bw-btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div className="bw-dropdown-menu">
              <button type="button" onClick={() => { setTitle("Nouveau document"); editor?.commands.setContent("<p></p>"); setMenuOpen(false); }}>
                <FileText size={15} /> Nouveau document
              </button>
              <button type="button" onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}>
                <FileUp size={15} /> Ouvrir / Importer (Word, TXT)
              </button>
              <button type="button" onClick={() => { localStorage.setItem("bersa-word-draft", JSON.stringify({ title, html: editor?.getHTML(), text: editor?.getText() })); setSaveState("Enregistré"); setNotice("Document sauvegardé."); setMenuOpen(false); }}>
                <Save size={15} /> Enregistrer
              </button>
              <div className="bw-menu-divider" />
              <button type="button" onClick={() => { exportDocxReal(); setMenuOpen(false); }}>
                <Download size={15} /> Exporter Word (.docx)
              </button>
              <button type="button" onClick={() => { window.print(); setMenuOpen(false); }}>
                <Printer size={15} /> Imprimer / PDF
              </button>
              <button type="button" onClick={() => { exportTxt(); setMenuOpen(false); }}>
                <FileText size={15} /> Exporter TXT
              </button>
              <button type="button" onClick={() => { exportHtml(); setMenuOpen(false); }}>
                <Download size={15} /> Exporter HTML
              </button>
              <div className="bw-menu-divider" />
              <button type="button" onClick={() => { if (navigator.share) { navigator.share({ title, text: editor?.getText() ?? "" }); } else { navigator.clipboard.writeText(editor?.getText() || ""); setNotice("Texte copié."); } setMenuOpen(false); }}>
                <Share2 size={15} /> Partager le texte
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. RUBAN À ONGLETS */}
      <nav className="bw-tabs-bar">
        {(["Accueil", "Insertion", "Mise en page", "Révision", "Affichage"] as const).map((t) => (
          <button key={t} type="button" className={`bw-tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      {/* OUTILS SELON L'ONGLET */}
      <section className="bw-tools-ribbon">
        {tab === "Accueil" && (
          <>
            <div className="bw-tool-group">
              <button type="button" className="bw-tool-btn" onClick={() => editor?.chain().undo().run()}><Undo2 size={13} /></button>
              <button type="button" className="bw-tool-btn" onClick={() => editor?.chain().redo().run()}><Redo2 size={13} /></button>
            </div>
            <div className="bw-tool-group">
              <select className="bw-select" value={font} onChange={(e) => { setFont(e.target.value); editor?.chain().focus().run(); }}>
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select className="bw-select" value={size} onChange={(e) => { setSize(e.target.value); editor?.chain().focus().run(); }}>
                {SIZES.map((s) => <option key={s} value={s}>{s} pt</option>)}
              </select>
            </div>
            <div className="bw-tool-group">
              <button type="button" className={`bw-tool-btn ${editor?.isActive("bold") ? "active" : ""}`} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={13} /></button>
              <button type="button" className={`bw-tool-btn ${editor?.isActive("italic") ? "active" : ""}`} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={13} /></button>
              <button type="button" className={`bw-tool-btn ${editor?.isActive("underline") ? "active" : ""}`} onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></button>
            </div>
            <div className="bw-tool-group">
              <button type="button" className={`bw-tool-btn ${editor?.isActive({ textAlign: "left" }) ? "active" : ""}`} onClick={() => editor?.chain().focus().setTextAlign("left").run()}><AlignLeft size={13} /></button>
              <button type="button" className={`bw-tool-btn ${editor?.isActive({ textAlign: "center" }) ? "active" : ""}`} onClick={() => editor?.chain().focus().setTextAlign("center").run()}><AlignCenter size={13} /></button>
              <button type="button" className={`bw-tool-btn ${editor?.isActive({ textAlign: "right" }) ? "active" : ""}`} onClick={() => editor?.chain().focus().setTextAlign("right").run()}><AlignRight size={13} /></button>
              <button type="button" className={`bw-tool-btn ${editor?.isActive({ textAlign: "justify" }) ? "active" : ""}`} onClick={() => editor?.chain().focus().setTextAlign("justify").run()}><AlignJustify size={13} /></button>
            </div>
            <div className="bw-tool-group">
              <button type="button" className={`bw-tool-btn ${editor?.isActive("bulletList") ? "active" : ""}`} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={13} /></button>
              <button type="button" className={`bw-tool-btn ${editor?.isActive("orderedList") ? "active" : ""}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></button>
            </div>
          </>
        )}

        {tab === "Insertion" && (
          <div className="bw-tool-group">
            <button type="button" className="bw-tool-btn" onClick={() => editor?.chain().focus().setHorizontalRule().run()}>Saut de page</button>
            <button type="button" className="bw-tool-btn" onClick={() => imgInputRef.current?.click()}>Insérer Image</button>
            <button type="button" className="bw-tool-btn" onClick={() => { const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); editor?.chain().focus().insertContent(` ${now} `).run(); }}>Date du jour</button>
          </div>
        )}

        {tab === "Mise en page" && (
          <div className="bw-tool-group">
            <label style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              Orientation :
              <select className="bw-select" value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Paysage</option>
              </select>
            </label>
            <label style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              Marges :
              <select className="bw-select" value={margins} onChange={(e) => setMargins(e.target.value)}>
                <option value="2.5cm">Normales (2,5 cm)</option>
                <option value="1.27cm">Étroites (1,27 cm)</option>
                <option value="3.8cm">Larges (3,8 cm)</option>
              </select>
            </label>
          </div>
        )}

        {tab === "Révision" && (
          <div className="bw-tool-group">
            <button type="button" className="bw-tool-btn" onClick={() => setSearchOpen(!searchOpen)}>
              <Search size={13} /> {searchOpen ? "Fermer recherche" : "Rechercher / Remplacer"}
            </button>
            <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
              {wordCount} mots · {charCount} caractères
            </span>
          </div>
        )}

        {tab === "Affichage" && (
          <div className="bw-tool-group">
            <button type="button" className="bw-tool-btn" onClick={() => setZoom(Math.max(50, zoom - 10))}><Minus size={13} /> Zoom -</button>
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{zoom}%</span>
            <button type="button" className="bw-tool-btn" onClick={() => setZoom(Math.min(150, zoom + 10))}><Plus size={13} /> Zoom +</button>
            <button type="button" className="bw-tool-btn" onClick={() => setZoom(100)}>100%</button>
          </div>
        )}
      </section>

      {/* RECHERCHE ET REMPLACEMENT */}
      {searchOpen && (
        <div style={{ background: "#e2e8f0", padding: "0.4rem 0.6rem", display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <input style={{ padding: "0.25rem 0.4rem", fontSize: "0.75rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1", flex: 1 }} placeholder="Rechercher…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <input style={{ padding: "0.25rem 0.4rem", fontSize: "0.75rem", borderRadius: "0.25rem", border: "1px solid #cbd5e1", flex: 1 }} placeholder="Remplacer par…" value={replaceTerm} onChange={(e) => setReplaceTerm(e.target.value)} />
          <button type="button" className="bw-tool-btn" onClick={handleReplaceAll}>Remplacer tout</button>
        </div>
      )}

      {/* 3. ESPACE CENTRAL A4 ALONGEABLE */}
      <main className="bw-workspace-area">
        <div className={`bw-a4-sheet ${orientation}`} style={{ transform: `scale(${zoom / 100})`, padding: margins, fontFamily: font, fontSize: `${size}pt` }}>
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* 4. BARRE FIXE INFÉRIEURE (5 BOUTONS) */}
      <div className="bw-bottom-toolbar">
        <button type="button" className="bw-bottom-btn" onClick={() => setNotice(`Document : Page 1 sur ${pageCount} · ${wordCount} mots`)}>
          <FileText size={18} /><span>Pages ({pageCount})</span>
        </button>
        <button type="button" className="bw-bottom-btn" onClick={() => editor?.commands.focus()}>
          <Keyboard size={18} /><span>Clavier</span>
        </button>
        <button type="button" className="bw-bottom-btn" onClick={startDictation}>
          <Mic size={18} /><span>Dictée</span>
        </button>
        <button type="button" className="bw-bottom-btn" onClick={() => handleOpenAi("assistant")}>
          <Sparkles size={18} /><span>Assistant</span>
        </button>
        <button type="button" className="bw-bottom-btn regenerate" onClick={() => handleOpenAi("regenerate")}>
          <RefreshCw size={18} /><span>Régénérer</span>
        </button>
      </div>

      {/* 5. BARRE D'ÉTAT INFÉRIEURE */}
      <footer className="bw-status-bar">
        <span>Page 1 sur {pageCount}</span>
        <span>{wordCount} mots</span>
        <div className="bw-zoom-ctrl">
          <button type="button" onClick={() => setZoom(Math.max(50, zoom - 10))}>-</button>
          <span>{zoom}%</span>
          <button type="button" onClick={() => setZoom(Math.min(150, zoom + 10))}>+</button>
        </div>
      </footer>

      {/* FICHIERS CACHÉS */}
      <input ref={fileInputRef} type="file" hidden accept=".docx,.txt,.html,.htm" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }} />
      <input ref={imgInputRef} type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f && editor) { const reader = new FileReader(); reader.onload = () => { editor.chain().focus().insertContent(`<img src="${reader.result}" alt="image" style="max-width:100%" />`).run(); }; reader.readAsDataURL(f); } }} />

      {/* NOTIFICATION */}
      {notice && (
        <div style={{ position: "fixed", bottom: "4.5rem", left: "1rem", right: "1rem", background: "#1e293b", color: "#ffffff", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50 }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* 6. MODALE IA & RÉGÉNÉRER */}
      {showAiModal && (
        <div className="bw-modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="bw-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="bw-modal-header">
              <h3>
                {aiMode === "regenerate" ? <RefreshCw size={17} /> : <Sparkles size={17} />}
                {aiMode === "regenerate" ? "Régénérer le texte" : "Assistant BERSA"}
              </h3>
              <button type="button" onClick={() => setShowAiModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.25rem 0 0.5rem" }}>
              {aiMode === "regenerate" ? "Choisissez l'action. Le texte original ne sera modifié qu'après votre validation." : "Enrichissez ou développez votre document avec l’Assistant BERSA."}
            </p>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Action souhaitée :</label>
            <select className="bw-select" style={{ width: "100%", marginBottom: "0.5rem" }} value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)}>
              <option value="Reformuler">Reformuler</option>
              <option value="Rendre plus professionnel">Rendre plus professionnel</option>
              <option value="Développer les arguments">Développer</option>
              <option value="Simplifier et clarifier">Simplifier</option>
              <option value="Améliorer le style et l'élégance">Améliorer le style</option>
              <option value="Corriger toutes les fautes d'orthographe et de grammaire">Corriger les fautes</option>
              <option value="Résumer de manière concise">Résumer</option>
              <option value="Continuer la rédaction de ce paragraphe">Continuer le texte</option>
            </select>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Passage sélectionné ou consigne :</label>
            <textarea style={{ width: "100%", height: "70px", padding: "0.4rem", fontSize: "0.75rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1", fontFamily: "inherit" }} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Texte à régénérer…" />
            <button type="button" className="bw-btn-primary" style={{ width: "100%", marginTop: "0.5rem" }} disabled={aiBusy} onClick={executeAi}>
              {aiBusy ? "Rédaction en cours…" : "Générer la proposition"}
            </button>
            {aiResult && (
              <>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, display: "block", marginTop: "0.75rem" }}>Résultat proposé :</label>
                <div className="bw-result-box">{aiResult}</div>
                <div className="bw-modal-actions">
                  <button type="button" className="bw-btn-primary" onClick={() => applyAiResult("replace")}>
                    <Check size={14} style={{ display: "inline", marginRight: "4px" }} /> Remplacer la sélection
                  </button>
                  <button type="button" className="bw-btn-secondary" onClick={() => applyAiResult("insertAfter")}>Insérer après</button>
                </div>
                <button type="button" className="bw-btn-secondary" style={{ width: "100%", marginTop: "0.35rem" }} onClick={() => { navigator.clipboard.writeText(aiResult); setNotice("Proposition copiée."); }}>
                  <Copy size={13} style={{ display: "inline", marginRight: "4px" }} /> Copier
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default BersaWordA4;              
