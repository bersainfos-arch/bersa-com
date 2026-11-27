import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  FileText,
  GraduationCap,
  Briefcase,
  Image as ImageIcon,
  LayoutTemplate,
  Mail,
  Scale,
  Building,
  Sparkles,
  ChevronRight,
  Bookmark,
  Trash2,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  FolderKanban,
} from "lucide-react";

import {
  CATEGORIES_CONFIG,
  ALL_MODELS,
  ACADEMIC_MODELS,
} from "@/lib/redaction-center/models-data";
import type {
  CategoryKey,
  ModelItem,
  GenerationFormData,
} from "@/lib/redaction-center/redaction-types";
import {
  getCreations,
  deleteCreation,
  toggleFavoriteCreation,
  type SavedCreation,
} from "@/lib/storage-creations";
import { DocumentGenerationModal } from "./DocumentGenerationModal";

interface RedactionHubProps {
  onOpenBlank: () => void;
  onStartGeneration: (data: GenerationFormData) => void;
  onOpenGraphicEditor?: (model: ModelItem) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-5 h-5" />,
  FileSpreadsheet: <Briefcase className="w-5 h-5" />,
  Image: <ImageIcon className="w-5 h-5" />,
  LayoutTemplate: <LayoutTemplate className="w-5 h-5" />,
  Mail: <Mail className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  Building: <Building className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
};

export const RedactionHub: React.FC<RedactionHubProps> = ({
  onOpenBlank,
  onStartGeneration,
  onOpenGraphicEditor,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "creations">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelForModal, setSelectedModelForModal] = useState<ModelItem | null>(null);

  // État local des créations stockées dans storage-creations.ts
  const [creations, setCreations] = useState<SavedCreation[]>([]);
  const [creationsFilter, setCreationsFilter] = useState<"all" | "draft" | "finished" | "favorites">("all");

  const refreshCreations = () => {
    setCreations(getCreations());
  };

  useEffect(() => {
    refreshCreations();
  }, []);

  // Filtrage des modèles
  const filteredModels = useMemo(() => {
    let list = ALL_MODELS;
    if (selectedCategory !== "all") {
      list = list.filter((m) => m.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  // Filtrage des créations enregistrées
  const filteredCreations = useMemo(() => {
    let list = creations;
    if (creationsFilter === "draft") list = list.filter((c) => c.status === "draft");
    if (creationsFilter === "finished") list = list.filter((c) => c.status === "finished");
    if (creationsFilter === "favorites") list = list.filter((c) => c.isFavorite);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }
    return list;
  }, [creations, creationsFilter, searchQuery]);

  const handleSelectModel = (model: ModelItem) => {
    // Si modèle visuel (affiche, flyer, invitation) et éditeur graphique fourni
    if (
      (model.category === "affiches" ||
        model.category === "flyers" ||
        model.category === "invitations") &&
      onOpenGraphicEditor
    ) {
      onOpenGraphicEditor(model);
      return;
    }
    // Sinon formulaire de génération avec l'assistant
    setSelectedModelForModal(model);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* En-tête principal du Centre de Rédaction */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-[#0B2863]">BERSA</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#0B2863]/10 text-[#0B2863] font-semibold uppercase tracking-wider">
                Centre de Rédaction
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Espace complet de création documentaire et graphique assistée
            </p>
          </div>

          {/* Bouton prioritaire : Page blanche */}
          <button
            onClick={onOpenBlank}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2863] hover:bg-[#081e4b] text-white text-sm font-semibold shadow-md shadow-[#0B2863]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nouvelle page blanche</span>
          </button>
        </div>

        {/* Barre d'onglets Catalogue / Mes créations */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 text-sm font-semibold border-t border-slate-100">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "catalog"
                ? "border-[#0B2863] text-[#0B2863]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Modèles & Gabarits</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("creations");
              refreshCreations();
            }}
            className={`py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "creations"
                ? "border-[#0B2863] text-[#0B2863]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Mes créations</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-xs">
              {creations.length}
            </span>
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "catalog"
                ? "Rechercher un modèle : mémoire, contrat, affiche, rapport..."
                : "Rechercher dans mes créations enregistrées..."
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2863]/30 focus:border-[#0B2863] transition-all"
          />
        </div>

        {activeTab === "catalog" ? (
          <>
            {/* Filtres par catégorie */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#0B2863] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tous les modèles ({ALL_MODELS.length})
              </button>
              {CATEGORIES_CONFIG.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.key
                      ? "bg-[#0B2863] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {CATEGORY_ICONS[cat.icon]}
                  <span>{cat.title}</span>
                </button>
              ))}
            </div>

            {/* Grille des modèles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model)}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-[#0B2863]/50 hover:shadow-lg hover:shadow-slate-200/60 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {model.category}
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0B2863] transition-colors">
                      {model.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {model.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B2863]">
                    <span>Choisir ce modèle</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Onglet Mes créations (stockées) */
          <div>
            <div className="flex items-center gap-2 mb-4">
              {(["all", "draft", "finished", "favorites"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCreationsFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    creationsFilter === f
                      ? "bg-[#0B2863] text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f === "all" ? "Toutes" : f === "draft" ? "Brouillons" : f === "finished" ? "Terminés" : "Favoris"}
                </button>
              ))}
            </div>

            {filteredCreations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">Aucune création trouvée</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Commencez par une page blanche ou utilisez un modèle du catalogue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => {
                            toggleFavoriteCreation(item.id);
                            refreshCreations();
                          }}
                          className={`p-1 rounded hover:bg-slate-100 ${
                            item.isFavorite ? "text-amber-500" : "text-slate-300"
                          }`}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.status === "finished" ? "Terminé" : "Brouillon"}
                      </span>
                      <button
                        onClick={() => {
                          deleteCreation(item.id);
                          refreshCreations();
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modale de paramétrage assisté du document */}
      {selectedModelForModal && (
        <DocumentGenerationModal
          model={selectedModelForModal}
          isOpen={true}
          onClose={() => setSelectedModelForModal(null)}
          onGenerate={(data) => {
            setSelectedModelForModal(null);
            onStartGeneration(data);
          }}
        />
      )}
    </div>
  );
};
