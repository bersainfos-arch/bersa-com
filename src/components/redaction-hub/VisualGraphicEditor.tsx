import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Download,
  Share2,
  Type,
  Image as ImageIcon,
  Palette,
  Maximize2,
  Square,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { RedactionDocumentTemplate } from "@/types/redaction-hub";
import { saveUserCreation } from "@/lib/storage-creations";

interface VisualGraphicEditorProps {
  template: RedactionDocumentTemplate;
  onBack: () => void;
}

export type CanvasFormat = "A4_PORTRAIT" | "A4_LANDSCAPE" | "A5" | "SQUARE_SOCIAL";

export interface GraphicElement {
  id: string;
  type: "text" | "heading" | "badge" | "box";
  content: string;
  x: number; // Pourcentage horizontal (0 à 100)
  y: number; // Pourcentage vertical (0 à 100)
  fontSize: number; // en px
  color: string;
  backgroundColor?: string;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  fontFamily: "Manrope" | "Cormorant Garamond" | "serif" | "sans-serif";
}

export const VisualGraphicEditor: React.FC<VisualGraphicEditorProps> = ({
  template,
  onBack,
}) => {
  const [format, setFormat] = useState<CanvasFormat>("A4_PORTRAIT");
  const [accentColor, setAccentColor] = useState("#1E3A8A");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");

  const [elements, setElements] = useState<GraphicElement[]>([
    {
      id: "el-1",
      type: "heading",
      content: template.title.toUpperCase(),
      x: 10,
      y: 12,
      fontSize: 26,
      color: "#1E3A8A",
      fontWeight: "bold",
      textAlign: "center",
      fontFamily: "Cormorant Garamond",
    },
    {
      id: "el-2",
      type: "text",
      content: "SOUS-TITRE OU ÉVÉNEMENT MAJEUR",
      x: 10,
      y: 22,
      fontSize: 14,
      color: "#475569",
      fontWeight: "normal",
      textAlign: "center",
      fontFamily: "Manrope",
    },
    {
      id: "el-3",
      type: "badge",
      content: "ENTRÉE LIBRE / SUR RÉSERVATION",
      x: 25,
      y: 78,
      fontSize: 12,
      color: "#FFFFFF",
      backgroundColor: "#1E3A8A",
      fontWeight: "bold",
      textAlign: "center",
      fontFamily: "Manrope",
    },
    {
      id: "el-4",
      type: "text",
      content: "Lieu : Kinshasa, RDC — Contact : contact@bersa.cd",
      x: 10,
      y: 88,
      fontSize: 11,
      color: "#64748B",
      fontWeight: "normal",
      textAlign: "center",
      fontFamily: "Manrope",
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>("el-1");
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedElement = elements.find((el) => el.id === selectedId);

  const handleUpdateSelected = (patch: Partial<GraphicElement>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el))
    );
  };

  const handleAddText = () => {
    const newEl: GraphicElement = {
      id: `el-${Date.now()}`,
      type: "text",
      content: "Nouveau texte",
      x: 20,
      y: 40,
      fontSize: 16,
      color: "#0F172A",
      fontWeight: "normal",
      textAlign: "center",
      fontFamily: "Manrope",
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleSaveGraphic = () => {
    saveUserCreation({
      id: `visual-${Date.now()}`,
      title: template.title,
      templateId: template.id,
      category: template.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "completed",
      isFavorite: false,
      visualData: { format, elements, accentColor, backgroundColor },
    });
    alert("Votre visuel a été sauvegardé avec succès dans « Mes créations » !");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col select-none">
      {/* Barre d'outils supérieure */}
      <header className="bg-[#1E293B] border-b border-[#334155] px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#E2E8F0]">{template.title}</span>
          <span className="text-[10px] bg-[#1E3A8A] text-white px-2 py-0.5 rounded-full font-semibold">
            Éditeur Visuel
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveGraphic}
            className="px-3.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Panneau latéral gauche : Contrôles d'éléments & Style */}
        <aside className="w-full md:w-80 bg-[#1E293B] border-r border-[#334155] p-4 overflow-y-auto space-y-5 order-2 md:order-1">
          {/* Format du canevas */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
              Format du support
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "A4_PORTRAIT", label: "A4 Portrait" },
                { id: "A4_LANDSCAPE", label: "A4 Paysage" },
                { id: "A5", label: "A5 Dépliant" },
                { id: "SQUARE_SOCIAL", label: "Carré Réseaux" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as CanvasFormat)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    format === f.id
                      ? "bg-[#1E3A8A] border-[#3B82F6] text-white"
                      : "bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions d'ajout d'éléments */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
              Ajouter au visuel
            </label>
            <button
              onClick={handleAddText}
              className="w-full py-2.5 px-3 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-[#3B82F6] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
            >
              <Type className="w-4 h-4 text-[#3B82F6]" />
              <span>Ajouter un bloc de texte</span>
            </button>
          </div>

          {/* Édition de l'élément sélectionné */}
          {selectedElement ? (
            <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E2E8F0]">Propriétés du texte</span>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1 text-[#EF4444] hover:bg-[#EF4444]/10 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] mb-1">Contenu textuel</label>
                <input
                  type="text"
                  value={selectedElement.content}
                  onChange={(e) => handleUpdateSelected({ content: e.target.value })}
                  className="w-full bg-[#1E293B] border border-[#475569] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#94A3B8] mb-1">Taille police</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => handleUpdateSelected({ fontSize: Number(e.target.value) })}
                    className="w-full bg-[#1E293B] border border-[#475569] rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#94A3B8] mb-1">Couleur</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => handleUpdateSelected({ color: e.target.value })}
                      className="w-7 h-7 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-[10px] text-[#94A3B8]">{selectedElement.color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] mb-1">Police de caractères</label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => handleUpdateSelected({ fontFamily: e.target.value as any })}
                  className="w-full bg-[#1E293B] border border-[#475569] rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option value="Manrope">Manrope (Moderne)</option>
                  <option value="Cormorant Garamond">Cormorant Garamond (Élégant BERSA)</option>
                  <option value="serif">Serif Classique</option>
                  <option value="sans-serif">Sans-Serif Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] mb-1">Alignement</label>
                <div className="grid grid-cols-3 gap-1">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => handleUpdateSelected({ textAlign: align })}
                      className={`py-1 text-[10px] font-bold uppercase rounded border ${
                        selectedElement.textAlign === align
                          ? "bg-[#1E3A8A] border-[#3B82F6] text-white"
                          : "bg-[#1E293B] border-[#475569] text-[#94A3B8]"
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#64748B] text-center italic py-4">
              Cliquez sur un élément du canevas pour ajuster sa police, sa couleur et sa position.
            </p>
          )}
        </aside>

        {/* Zone de travail centrale : Canevas Visuel interactif */}
        <main className="flex-1 bg-[#0F172A] p-4 sm:p-8 flex items-center justify-center overflow-auto order-1 md:order-2">
          <div
            ref={canvasRef}
            onClick={() => setSelectedId(null)}
            className="relative shadow-2xl transition-all duration-300 rounded-sm overflow-hidden"
            style={{
              backgroundColor: backgroundColor,
              width:
                format === "A4_PORTRAIT"
                  ? "420px"
                  : format === "A4_LANDSCAPE"
                  ? "590px"
                  : format === "A5"
                  ? "340px"
                  : "420px",
              height:
                format === "A4_PORTRAIT"
                  ? "594px"
                  : format === "A4_LANDSCAPE"
                  ? "420px"
                  : format === "A5"
                  ? "480px"
                  : "420px",
            }}
          >
            {/* Bordure décorative BERSA */}
            <div
              className="absolute inset-2 border pointer-events-none"
              style={{ borderColor: accentColor, opacity: 0.2 }}
            />

            {/* Éléments graphiques positionnables */}
            {elements.map((el) => {
              const isSelected = selectedId === el.id;

              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                  }}
                  className={`absolute cursor-pointer transition-shadow p-1.5 rounded ${
                    isSelected ? "ring-2 ring-[#3B82F6] bg-[#3B82F6]/5" : ""
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: "80%",
                    textAlign: el.textAlign,
                  }}
                >
                  {el.type === "badge" ? (
                    <span
                      style={{
                        backgroundColor: el.backgroundColor || accentColor,
                        color: el.color,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.fontWeight,
                        fontFamily: el.fontFamily,
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        display: "inline-block",
                        letterSpacing: "1px",
                      }}
                    >
                      {el.content}
                    </span>
                  ) : (
                    <div
                      style={{
                        color: el.color,
                        fontSize: `${el.fontSize}px`,
                        fontWeight: el.fontWeight,
                        fontFamily: el.fontFamily,
                        lineHeight: 1.25,
                      }}
                    >
                      {el.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};
