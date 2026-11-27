import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Download,
  Share2,
  Type,
  Palette,
  Maximize2,
  Undo2,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Check,
} from "lucide-react";
import type { ModelItem } from "@/lib/redaction-center/redaction-types";
import { saveCreation } from "@/lib/storage-creations";

interface VisualGraphicEditorProps {
  model: ModelItem;
  onBack: () => void;
}

export type CanvasFormat = "A4_PORTRAIT" | "A4_LANDSCAPE" | "CARRE_RESEAUX";

export interface GraphicElement {
  id: string;
  type: "heading" | "text" | "badge";
  content: string;
  x: number; // 0 à 100%
  y: number; // 0 à 100%
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
  textAlign: "left" | "center" | "right";
  fontFamily: "Manrope" | "Cormorant Garamond";
}

export const VisualGraphicEditor: React.FC<VisualGraphicEditorProps> = ({
  model,
  onBack,
}) => {
  const [format, setFormat] = useState<CanvasFormat>("A4_PORTRAIT");
  const [accentColor, setAccentColor] = useState("#0B2863"); // Bleu royal BERSA
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [elements, setElements] = useState<GraphicElement[]>([
    {
      id: "1",
      type: "badge",
      content: model.badge || "ÉVÉNEMENT OFFICIEL",
      x: 50,
      y: 12,
      fontSize: 13,
      color: "#0B2863",
      fontWeight: "bold",
      textAlign: "center",
      fontFamily: "Manrope",
    },
    {
      id: "2",
      type: "heading",
      content: model.title,
      x: 50,
      y: 28,
      fontSize: 28,
      color: "#0B2863",
      fontWeight: "bold",
      textAlign: "center",
      fontFamily: "Cormorant Garamond",
    },
    {
      id: "3",
      type: "text",
      content: model.description || "Présentation et détails de votre communication ici.",
      x: 50,
      y: 48,
      fontSize: 15,
      color: "#334155",
      fontWeight: "normal",
      textAlign: "center",
      fontFamily: "Manrope",
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>("2");
  const selectedElement = elements.find((e) => e.id === selectedId);

  const updateSelected = (patch: Partial<GraphicElement>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el))
    );
  };

  const handleAddText = () => {
    const newEl: GraphicElement = {
      id: `el_${Date.now()}`,
      type: "text",
      content: "Nouveau texte",
      x: 50,
      y: 65,
      fontSize: 16,
      color: "#1E293B",
      fontWeight: "normal",
      textAlign: "center",
      fontFamily: "Manrope",
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleSaveToCreations = () => {
    saveCreation({
      title: model.title,
      category: model.category,
      templateId: model.id,
      status: "finished",
      isFavorite: false,
      visualData: { format, bgColor, accentColor, elements },
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Barre supérieure */}
      <header className="h-14 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Centre de création</span>
          </button>
          <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
            {model.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Format */}
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as CanvasFormat)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="A4_PORTRAIT">A4 Portrait</option>
            <option value="A4_LANDSCAPE">A4 Paysage</option>
            <option value="CARRE_RESEAUX">Carré Réseaux</option>
          </select>

          {/* Sauvegarder */}
          <button
            onClick={handleSaveToCreations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? "Enregistré !" : "Enregistrer"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Zone centrale : Toile */}
        <main className="flex-1 bg-slate-950 p-4 sm:p-8 flex items-center justify-center overflow-auto">
          <div
            style={{
              backgroundColor: bgColor,
              aspectRatio:
                format === "A4_PORTRAIT" ? "1 / 1.414" : format === "A4_LANDSCAPE" ? "1.414 / 1" : "1 / 1",
              maxWidth: format === "A4_LANDSCAPE" ? "750px" : "520px",
            }}
            className="w-full relative shadow-2xl rounded-sm border border-slate-800 transition-all duration-200 select-none overflow-hidden"
          >
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              return (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  style={{
                    position: "absolute",
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${el.fontSize}px`,
                    color: el.color,
                    fontWeight: el.fontWeight,
                    textAlign: el.textAlign,
                    fontFamily: el.fontFamily,
                  }}
                  className={`cursor-pointer px-2 py-1 rounded transition-all max-w-[90%] break-words ${
                    isSelected ? "ring-2 ring-[#0B2863] ring-offset-1 ring-offset-white bg-blue-50/20" : ""
                  }`}
                >
                  {el.content}
                </div>
              );
            })}
          </div>
        </main>

        {/* Panneau latéral d'édition */}
        <aside className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
          {selectedElement ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personnaliser l'élément
              </h3>

              {/* Texte */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Contenu</label>
                <textarea
                  rows={2}
                  value={selectedElement.content}
                  onChange={(e) => updateSelected({ content: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Taille & Couleur */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Taille</label>
                  <input
                    type="range"
                    min="10"
                    max="64"
                    value={selectedElement.fontSize}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Couleur</label>
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                    className="w-full h-7 rounded bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Police */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Typographie</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSelected({ fontFamily: "Manrope" })}
                    className={`py-1.5 text-xs rounded border ${
                      selectedElement.fontFamily === "Manrope"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Manrope (Moderne)
                  </button>
                  <button
                    onClick={() => updateSelected({ fontFamily: "Cormorant Garamond" })}
                    className={`py-1.5 text-xs rounded border font-serif ${
                      selectedElement.fontFamily === "Cormorant Garamond"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Cormorant (Élégant)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Cliquez sur un texte sur la toile pour le modifier.</p>
          )}

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleAddText}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un bloc texte</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
